package security

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSignAndParseToken(t *testing.T) {
	secret := "test-secret-key-that-is-long-enough-32"
	token, err := SignToken(secret, 1, "test@example.com", "pollster", "testuser", time.Hour)
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := ParseToken(secret, token)
	require.NoError(t, err)
	assert.Equal(t, uint(1), claims.VoterID)
	assert.Equal(t, "test@example.com", claims.Email)
	assert.Equal(t, "pollster", claims.Role)
	assert.Equal(t, "testuser", claims.Username)
}

func TestParseToken_InvalidSecret(t *testing.T) {
	secret := "test-secret-key-that-is-long-enough-32"
	wrongSecret := "wrong-secret-key-that-is-long-enough"
	token, _ := SignToken(secret, 1, "test@example.com", "pollster", "testuser", time.Hour)

	_, err := ParseToken(wrongSecret, token)
	assert.Error(t, err)
}

func TestParseToken_InvalidToken(t *testing.T) {
	secret := "test-secret-key-that-is-long-enough-32"
	_, err := ParseToken(secret, "invalid-token")
	assert.Error(t, err)
}

func TestHashToken(t *testing.T) {
	token := "test-token-123"
	hash1 := HashToken(token)
	hash2 := HashToken(token)
	assert.Equal(t, hash1, hash2)
	assert.Len(t, hash1, 64)
}

func TestHashToken_Different(t *testing.T) {
	hash1 := HashToken("token1")
	hash2 := HashToken("token2")
	assert.NotEqual(t, hash1, hash2)
}

func TestValidateSecret(t *testing.T) {
	err := ValidateSecret("this-is-a-very-long-secret-key-32chars")
	assert.NoError(t, err)

	err = ValidateSecret("short")
	assert.Error(t, err)
}
