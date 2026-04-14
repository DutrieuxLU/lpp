package security

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

var (
	ErrInvalidHash  = errors.New("invalid hash format")
	ErrHashTooShort = errors.New("hash too short")
)

type Params struct {
	Time    uint32
	Memory  uint32
	Threads uint8
	KeyLen  uint32
	SaltLen uint32
}

var DefaultParams = Params{
	Time:    2,
	Memory:  64 * 1024,
	Threads: 4,
	KeyLen:  32,
	SaltLen: 16,
}

func HashPassword(password string, params ...Params) (string, error) {
	p := DefaultParams
	if len(params) > 0 {
		p = params[0]
	}

	salt := make([]byte, p.SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, p.Time, p.Memory, p.Threads, p.KeyLen)

	encodedSalt := base64.RawStdEncoding.EncodeToString(salt)
	encodedHash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", p.Memory, p.Time, p.Threads, encodedSalt, encodedHash), nil
}

func VerifyPassword(password, hash string) (bool, error) {
	parts := parseHash(hash)
	if parts == nil {
		return false, ErrInvalidHash
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts.salt)
	if err != nil || len(salt) < 8 {
		return false, fmt.Errorf("salt decode error: %w", err)
	}

	expectedHash := argon2.IDKey([]byte(password), salt, parts.time, parts.memory, parts.threads, parts.keyLen)

	actualHash, err := base64.RawStdEncoding.DecodeString(parts.hash)
	if err != nil {
		return false, fmt.Errorf("hash decode error: %w", err)
	}

	if subtleConstantTimeDiff(expectedHash, actualHash) {
		return false, nil
	}

	return true, nil
}

func subtleConstantTimeDiff(a, b []byte) bool {
	if len(a) != len(b) {
		return true
	}
	var diff byte
	for i := range a {
		diff |= a[i] ^ b[i]
	}
	return diff != 0
}

type hashParts struct {
	time    uint32
	memory  uint32
	threads uint8
	keyLen  uint32
	salt    string
	hash    string
}

func parseHash(hash string) *hashParts {
	parts := strings.Split(hash, "$")
	if len(parts) != 6 {
		return nil
	}

	var hp hashParts
	_, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &hp.memory, &hp.time, &hp.threads)
	if err != nil {
		return nil
	}

	hp.salt = parts[4]
	hp.hash = parts[5]
	hp.keyLen = 32

	return &hp
}
