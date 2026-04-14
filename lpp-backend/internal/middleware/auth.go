package middleware

import (
	"net/http"
	"strings"

	"lpp-backend/internal/security"

	"github.com/gin-gonic/gin"
)

func AuthRequired(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			cookie, err := c.Cookie("access_token")
			if err != nil || cookie == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
				c.Abort()
				return
			}
			token = cookie
		}

		if strings.HasPrefix(token, "Bearer ") {
			token = strings.TrimPrefix(token, "Bearer ")
		}

		claims, err := security.ParseToken(secret, token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("voterId", claims.VoterID)
		c.Set("voterEmail", claims.Email)
		c.Set("voterRole", claims.Role)
		c.Set("voterUsername", claims.Username)

		c.Next()
	}
}

func GetVoterID(c *gin.Context) uint {
	if id, exists := c.Get("voterId"); exists {
		return id.(uint)
	}
	return 0
}

func GetVoterRole(c *gin.Context) string {
	if role, exists := c.Get("voterRole"); exists {
		return role.(string)
	}
	return ""
}
