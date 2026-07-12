#include "Crypto.h"

#include <argon2.h>
#include <random>

#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/bio.h>
#include <openssl/rsa.h>
#include <openssl/err.h>
#include <openssl/rand.h>

boost::asio::thread_pool& cryptoPool()
{
	static boost::asio::thread_pool pool(2);
	return pool;
}

std::vector<uint8_t> Crypto::generateSalt()
{
	std::vector<uint8_t> salt(SALT_LEN);

	if (RAND_bytes(salt.data(), static_cast<int>(salt.size())) != 1)
		throwOpenSSLError("failed generating salt");

	return salt;
}

Async<std::string> Crypto::hashPasswordAsync(std::string const& password)
{
	co_return co_await boost::asio::co_spawn(
		cryptoPool(),
		[password]() -> boost::asio::awaitable<std::string> {
			co_return co_await hashPassword(password);
		},
		boost::asio::use_awaitable);
}

Async<std::string> Crypto::hashPassword(std::string const& password)
{
	std::vector<uint8_t> salt = generateSalt();

	size_t encoded_length = argon2_encodedlen(T_COST, M_COST, PARALLELISM, SALT_LEN, HASH_LEN, Argon2_id);
	std::string encoded(encoded_length, '\0');

	int result = argon2id_hash_encoded(
		T_COST, M_COST, PARALLELISM,
		password.data(), password.size(),
		salt.data(), salt.size(),
		HASH_LEN,
		encoded.data(), encoded.size()
	);

	if (result != ARGON2_OK)
		throw std::runtime_error(std::string("password hashing failed: ") + argon2_error_message(result));

	encoded.resize(std::strlen(encoded.c_str()));
	co_return encoded;
}


Async<bool> Crypto::verifyPasswordAsync(std::string const& password, std::string const& stored_password)
{
	co_return co_await boost::asio::co_spawn(
		cryptoPool(),
		[password, stored_password]()->boost::asio::awaitable<bool> {
			co_return co_await verifyPassword(password, stored_password);
		},
		boost::asio::use_awaitable);
}

Async<bool> Crypto::verifyPassword(std::string const& password, std::string const& stored_password)
{
	int result = argon2id_verify(stored_password.c_str(), password.data(), password.size());

	if (result == ARGON2_OK) co_return true;
	else if (result == ARGON2_VERIFY_MISMATCH) co_return false;
	
	throw std::runtime_error(std::string("pasword verification failed: ") + argon2_error_message(result));
}


std::pair<std::string, std::string> Crypto::generateKeyPair()
{
	EVP_PKEY_CTX_ptr ctx(EVP_PKEY_CTX_new_id(EVP_PKEY_RSA, nullptr), EVP_PKEY_CTX_free);

	if (!ctx) throwOpenSSLError("Failed creating keygen context");

	if (EVP_PKEY_keygen_init(ctx.get()) <= 0) 
		throwOpenSSLError("Failed initializing keygen");

	if (EVP_PKEY_CTX_set_rsa_keygen_bits(ctx.get(), RSA_KEY_BITS) <= 0)
		throwOpenSSLError("failed setting key size");

	EVP_PKEY* raw_pkey = nullptr;
	if (EVP_PKEY_keygen(ctx.get(), &raw_pkey) <= 0)
		throwOpenSSLError("failed generating key pair");

	EVP_PKEY_ptr pkey(raw_pkey, EVP_PKEY_free);

	BIO_ptr pub_bio(BIO_new(BIO_s_mem()), BIO_free);
	if (!PEM_write_bio_PUBKEY(pub_bio.get(), pkey.get()))
		throwOpenSSLError("failed writing public key");

	char* pub_data = nullptr;
	long pub_len = BIO_get_mem_data(pub_bio.get(), &pub_data);
	std::string public_key(pub_data, pub_len);

	BIO_ptr priv_bio(BIO_new(BIO_s_mem()), BIO_free);
	if (!PEM_write_bio_PrivateKey(priv_bio.get(), pkey.get(), nullptr, nullptr, 0, nullptr, nullptr))
		throwOpenSSLError("failed writing private key");

	char* priv_data = nullptr;
	long priv_len = BIO_get_mem_data(priv_bio.get(), &priv_data);
	std::string private_key(priv_data, priv_len);

	return { public_key, private_key };
}

std::string Crypto::encryptAsymetrically(std::string const& plainText, std::string const& public_key_pem)
{
	BIO_ptr bio(BIO_new_mem_buf(public_key_pem.data(), static_cast<int>(public_key_pem.size())), BIO_free);
	EVP_PKEY_ptr pkey(PEM_read_bio_PUBKEY(bio.get(), nullptr, nullptr, nullptr), EVP_PKEY_free);
	if (!pkey)
		throwOpenSSLError("failed reading public key");

	EVP_PKEY_CTX_ptr ctx(EVP_PKEY_CTX_new(pkey.get(), nullptr), EVP_PKEY_CTX_free);
	if (!ctx || EVP_PKEY_encrypt_init(ctx.get()) <= 0)
		throwOpenSSLError("failed initializing encryption");

	if (EVP_PKEY_CTX_set_rsa_padding(ctx.get(), RSA_PKCS1_OAEP_PADDING) <= 0)
		throwOpenSSLError("failed setting padding");

	size_t out_len = 0;
	if (EVP_PKEY_encrypt(ctx.get(), nullptr, &out_len,
		reinterpret_cast<const unsigned char*>(plainText.data()), plainText.size()) <= 0)
		throwOpenSSLError("failed sizing ciphertext");

	std::string ciphertext(out_len, '\0');
	if (EVP_PKEY_encrypt(ctx.get(), reinterpret_cast<unsigned char*>(ciphertext.data()), &out_len,
		reinterpret_cast<const unsigned char*>(plainText.data()), plainText.size()) <= 0)
		throwOpenSSLError("failed encrypting");

	ciphertext.resize(out_len);
	return ciphertext;
}

std::string Crypto::decryptAsymetrically(std::string const& ciphertext, std::string const& private_key_pem)
{
	BIO_ptr bio(BIO_new_mem_buf(private_key_pem.data(), static_cast<int>(private_key_pem.size())), BIO_free);
	EVP_PKEY_ptr pkey(PEM_read_bio_PrivateKey(bio.get(), nullptr, nullptr, nullptr), EVP_PKEY_free);
	if (!pkey)
		throwOpenSSLError("failed reading private key");

	EVP_PKEY_CTX_ptr ctx(EVP_PKEY_CTX_new(pkey.get(), nullptr), EVP_PKEY_CTX_free);
	if (!ctx || EVP_PKEY_decrypt_init(ctx.get()) <= 0)
		throwOpenSSLError("failed initializing decryption");

	if (EVP_PKEY_CTX_set_rsa_padding(ctx.get(), RSA_PKCS1_OAEP_PADDING) <= 0)
		throwOpenSSLError("failed setting padding");

	size_t out_len = 0;
	if (EVP_PKEY_decrypt(ctx.get(), nullptr, &out_len,
		reinterpret_cast<const unsigned char*>(ciphertext.data()), ciphertext.size()) <= 0)
		throwOpenSSLError("failed sizing plaintext");

	std::string plaintext(out_len, '\0');
	if (EVP_PKEY_decrypt(ctx.get(), reinterpret_cast<unsigned char*>(plaintext.data()), &out_len,
		reinterpret_cast<const unsigned char*>(ciphertext.data()), ciphertext.size()) <= 0)
		throwOpenSSLError("failed decrypting");

	plaintext.resize(out_len);
	return plaintext;
}

std::string Crypto::encryptSymetrically(std::string const& plaintext, std::string const& key)
{
	if (key.size() != AES_KEY_LEN)
		throw std::invalid_argument("key must be 32 bytes for AES-256");

	std::string iv(GCM_IV_LEN, '\0');
	if (RAND_bytes(reinterpret_cast<unsigned char*>(iv.data()), GCM_IV_LEN) != 1)
		throwOpenSSLError("failed generating IV");

	EVP_CIPHER_CTX_ptr ctx(EVP_CIPHER_CTX_new(), EVP_CIPHER_CTX_free);
	if (!ctx)
		throwOpenSSLError("failed creating cipher context");

	if (EVP_EncryptInit_ex(ctx.get(), EVP_aes_256_gcm(), nullptr, nullptr, nullptr) != 1)
		throwOpenSSLError("failed initializing cipher");

	if (EVP_CIPHER_CTX_ctrl(ctx.get(), EVP_CTRL_GCM_SET_IVLEN, GCM_IV_LEN, nullptr) != 1)
		throwOpenSSLError("failed setting IV length");

	if (EVP_EncryptInit_ex(ctx.get(), nullptr, nullptr,
		reinterpret_cast<const unsigned char*>(key.data()),
		reinterpret_cast<const unsigned char*>(iv.data())) != 1)
		throwOpenSSLError("failed setting key/iv");

	std::string ciphertext(plaintext.size(), '\0');
	int out_len = 0;

	if (EVP_EncryptUpdate(ctx.get(),
		reinterpret_cast<unsigned char*>(ciphertext.data()), &out_len,
		reinterpret_cast<const unsigned char*>(plaintext.data()), static_cast<int>(plaintext.size())) != 1)
		throwOpenSSLError("failed encrypting");

	int total_len = out_len;

	int final_len = 0;
	if (EVP_EncryptFinal_ex(ctx.get(),
		reinterpret_cast<unsigned char*>(ciphertext.data()) + total_len, &final_len) != 1)
		throwOpenSSLError("failed finalizing encryption");

	total_len += final_len;
	ciphertext.resize(total_len);

	std::string tag(GCM_TAG_LEN, '\0');
	if (EVP_CIPHER_CTX_ctrl(ctx.get(), EVP_CTRL_GCM_GET_TAG, GCM_TAG_LEN, tag.data()) != 1)
		throwOpenSSLError("failed getting auth tag");

	return iv + tag + ciphertext;
}

std::string Crypto::decryptSymetrically(std::string const& ciphertext, std::string const& key)
{
	if (key.size() != AES_KEY_LEN)
		throw std::invalid_argument("key must be 32 bytes for AES-256");

	if (ciphertext.size() < static_cast<size_t>(GCM_IV_LEN + GCM_TAG_LEN))
		throw std::invalid_argument("ciphertext too short");

	std::string iv = ciphertext.substr(0, GCM_IV_LEN);
	std::string tag = ciphertext.substr(GCM_IV_LEN, GCM_TAG_LEN);
	std::string actual_ciphertext = ciphertext.substr(GCM_IV_LEN + GCM_TAG_LEN);

	EVP_CIPHER_CTX_ptr ctx(EVP_CIPHER_CTX_new(), EVP_CIPHER_CTX_free);
	if (!ctx)
		throwOpenSSLError("failed creating cipher context");

	if (EVP_DecryptInit_ex(ctx.get(), EVP_aes_256_gcm(), nullptr, nullptr, nullptr) != 1)
		throwOpenSSLError("failed initializing cipher");

	if (EVP_CIPHER_CTX_ctrl(ctx.get(), EVP_CTRL_GCM_SET_IVLEN, GCM_IV_LEN, nullptr) != 1)
		throwOpenSSLError("failed setting IV length");

	if (EVP_DecryptInit_ex(ctx.get(), nullptr, nullptr,
		reinterpret_cast<const unsigned char*>(key.data()),
		reinterpret_cast<const unsigned char*>(iv.data())) != 1)
		throwOpenSSLError("failed setting key/iv");

	std::string plaintext(actual_ciphertext.size(), '\0');
	int out_len = 0;

	if (EVP_DecryptUpdate(ctx.get(),
		reinterpret_cast<unsigned char*>(plaintext.data()), &out_len,
		reinterpret_cast<const unsigned char*>(actual_ciphertext.data()), static_cast<int>(actual_ciphertext.size())) != 1)
		throwOpenSSLError("failed decrypting");

	int total_len = out_len;

	if (EVP_CIPHER_CTX_ctrl(ctx.get(), EVP_CTRL_GCM_SET_TAG, GCM_TAG_LEN,
		const_cast<char*>(tag.data())) != 1)
		throwOpenSSLError("failed setting auth tag");

	int final_len = 0;
	if (EVP_DecryptFinal_ex(ctx.get(),
		reinterpret_cast<unsigned char*>(plaintext.data()) + total_len, &final_len) != 1)
		throw std::runtime_error("decryption failed: authentication tag mismatch (data may be tampered)");

	total_len += final_len;
	plaintext.resize(total_len);

	return plaintext;
}
