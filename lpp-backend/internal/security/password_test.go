package security

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHashPassword(t *testing.T) {
	hash, err := HashPassword("testpassword123")
	require.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.Contains(t, hash, "$argon2id$")
}

func TestVerifyPassword(t *testing.T) {
	hash, err := HashPassword("mypassword")
	require.NoError(t, err)

	valid, err := VerifyPassword("mypassword", hash)
	assert.NoError(t, err)
	assert.True(t, valid)

	valid, err = VerifyPassword("wrongpassword", hash)
	assert.NoError(t, err)
	assert.False(t, valid)
}

func TestVerifyPassword_InvalidHash(t *testing.T) {
	valid, err := VerifyPassword("password", "invalid-hash")
	assert.Error(t, err)
	assert.False(t, valid)
}

func TestHashPassword_DifferentHashes(t *testing.T) {
	hash1, _ := HashPassword("samepassword")
	hash2, _ := HashPassword("samepassword")
	assert.NotEqual(t, hash1, hash2)
}

func TestVerifyPassword_EmptyPassword(t *testing.T) {
	hash, _ := HashPassword("password")
	valid, err := VerifyPassword("", hash)
	assert.NoError(t, err)
	assert.False(t, valid)
}
