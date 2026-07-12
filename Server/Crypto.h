#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <memory>     
#include <utility>    
#include <stdexcept>   

#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/err.h>

#include <boost/asio/post.hpp>
#include <boost/asio/use_awaitable.hpp>
#include <boost/asio/thread_pool.hpp>
#include <boost/asio/co_spawn.hpp>

template <typename T>
using Async = boost::asio::awaitable<T>;

namespace Crypto
{

	constexpr uint32_t T_COST = 3;
	constexpr uint32_t M_COST = 1 << 16;
	constexpr uint32_t PARALLELISM = 1;
	constexpr size_t SALT_LEN = 16;
	constexpr size_t HASH_LEN = 32;
	constexpr int RSA_KEY_BITS = 3072;
	constexpr int AES_KEY_LEN = 32; 
	constexpr int GCM_IV_LEN = 12;   
	constexpr int GCM_TAG_LEN = 16;

	using EVP_CIPHER_CTX_ptr = std::unique_ptr<EVP_CIPHER_CTX, decltype(&EVP_CIPHER_CTX_free)>;

	using EVP_PKEY_ptr = std::unique_ptr<EVP_PKEY, decltype(&EVP_PKEY_free)>;
	using EVP_PKEY_CTX_ptr = std::unique_ptr<EVP_PKEY_CTX, decltype(&EVP_PKEY_CTX_free)>;
	using BIO_ptr = std::unique_ptr<BIO, decltype(&BIO_free)>;


	inline std::string throwOpenSSLError(std::string const& context)
	{
		unsigned long err = ERR_get_error();
		char buf[256];
		ERR_error_string_n(err, buf, sizeof(buf));
		throw std::runtime_error(context + ": " + buf);
	}

	std::vector<uint8_t> generateSalt();
	Async<std::string> hashPassword(std::string const&);
	Async<std::string> hashPasswordAsync(std::string const&);

	Async<bool> verifyPassword(std::string const&, std::string const&);
	Async<bool> verifyPasswordAsync(std::string const&, std::string const&);

	std::string encryptSymetrically(std::string const&, std::string const&);
	std::string decryptSymetrically(std::string const&, std::string const&);

	std::pair<std::string, std::string> generateKeyPair();
	std::string encryptAsymetrically(std::string const&, std::string const&);
	std::string decryptAsymetrically(std::string const&, std::string const&);

}