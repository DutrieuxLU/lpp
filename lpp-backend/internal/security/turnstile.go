package security

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

func VerifyTurnstile(token, secret string) (bool, error) {
	if token == "" {
		return false, fmt.Errorf("empty turnstile token")
	}

	reqBody := fmt.Sprintf("secret=%s&response=%s", secret, strings.ReplaceAll(token, " ", "+"))

	resp, err := http.Post("https://challenges.cloudflare.com/turnstile/v0/siteverify", "application/x-www-form-urlencoded", strings.NewReader(reqBody))
	if err != nil {
		return false, fmt.Errorf("turnstile request failed: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("failed to parse turnstile response: %w", err)
	}

	return result.Success, nil
}
