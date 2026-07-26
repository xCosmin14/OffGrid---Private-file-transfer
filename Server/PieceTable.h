#pragma once
#include <vector>
#include <string>

struct Piece
{
	bool from_add_buffer;
	size_t start, length;
};

class PieceTable
{
	std::string original, addBuffer;
	std::vector<Piece> pieces;

public:

	PieceTable() = default;

	PieceTable(std::string initialContent):original(std::move(initialContent))
	{
		if (!original.empty())
			pieces.push_back({ false, 0, original.size() });
	}

	void insert(size_t position, const std::string& text)
	{
		size_t addStart = addBuffer.size();
		addBuffer += text;

		size_t offset = 0;
		for (size_t i = 0; i < pieces.size(); i++)
		{
			size_t pieceEnd = offset + pieces[i].length;
			
			if (position == offset)
			{
				pieces.insert(pieces.begin() + i, { true, addStart, text.size() });
				return;
			}
			if (position > offset && position < pieceEnd)
			{
				size_t firstLen = position - offset;
				Piece first = { pieces[i].from_add_buffer, pieces[i].start, firstLen };
				Piece second = { pieces[i].from_add_buffer, pieces[i].start + firstLen, pieces[i].length - firstLen };

				pieces[i] = first;
				pieces.insert(pieces.begin() + i + 1, { true, addStart, text.size() });
				pieces.insert(pieces.begin() + i + 2, second);
				return;
			}

			offset = pieceEnd;
		}

		pieces.push_back({ true, addStart, text.size() });

	}

	void erase(size_t position, size_t length)
	{
		size_t offset = 0;
		size_t remaining = length;

		for (size_t i = 0; i < pieces.size() && remaining > 0; )
		{
			size_t pieceEnd = offset + pieces[i].length;

			if (position >= pieceEnd)
			{
				offset = pieceEnd;
				i++;
				continue;
			}

			size_t cutStart = std::max(position, offset) - offset;
			size_t cutEnd = std::min(position + remaining, pieceEnd) - offset;
			size_t cutLen = cutEnd - cutStart;

			if (cutStart == 0 && cutLen == pieces[i].length)
			{
				pieces.erase(pieces.begin() + i);
				remaining -= cutLen;
				continue; 
			}
			else if (cutStart == 0)
			{
				pieces[i].start += cutLen;
				pieces[i].length -= cutLen;
				remaining -= cutLen;
			}
			else if (cutEnd == pieces[i].length)
			{
				pieces[i].length -= cutLen;
				remaining -= cutLen;
			}
			else
			{
				Piece after = { pieces[i].from_add_buffer, pieces[i].start + cutEnd, pieces[i].length - cutEnd };
				pieces[i].length = cutStart;
				pieces.insert(pieces.begin() + i + 1, after);
				remaining -= cutLen;
			}

			offset += pieces[i].length;
			i++;
		}
	}

	std::string getContent() const
	{
		std::string result;
		for (auto& p : pieces)
			result += (p.from_add_buffer ? addBuffer : original).substr(p.start, p.length);
		return result;
	}
};