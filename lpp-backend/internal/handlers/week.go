package handlers

import (
	"net/http"

	"lpp-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterWeekRoutes(group *gin.RouterGroup, db *gorm.DB) {
	weekHandler := NewWeekHandler(db)

	group.GET("/weeks", weekHandler.GetWeeks)
	group.GET("/weeks/:id", weekHandler.GetWeek)
	group.POST("/weeks", weekHandler.CreateWeek)
	group.PUT("/weeks/:id", weekHandler.UpdateWeek)
}

type WeekHandler struct {
	db *gorm.DB
}

func NewWeekHandler(db *gorm.DB) *WeekHandler {
	return &WeekHandler{db: db}
}

func (h *WeekHandler) GetWeeks(c *gin.Context) {
	var weeks []models.PollWeek
	query := h.db

	if year := c.Query("year"); year != "" {
		query = query.Where("year = ?", year)
	}
	if split := c.Query("split"); split != "" {
		query = query.Where("split = ?", split)
	}

	if err := query.Order("year DESC, week_number DESC").Find(&weeks).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, []models.PollWeek{})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if weeks == nil {
		weeks = []models.PollWeek{}
	}

	c.JSON(http.StatusOK, weeks)
}

func (h *WeekHandler) GetWeek(c *gin.Context) {
	id := c.Param("id")
	var week models.PollWeek
	if err := h.db.First(&week, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll week not found"})
		return
	}
	c.JSON(http.StatusOK, week)
}

func (h *WeekHandler) CreateWeek(c *gin.Context) {
	var week models.PollWeek
	if err := c.ShouldBindJSON(&week); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Create(&week).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, week)
}

func (h *WeekHandler) UpdateWeek(c *gin.Context) {
	id := c.Param("id")
	var week models.PollWeek
	if err := h.db.First(&week, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll week not found"})
		return
	}

	var update models.PollWeek
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	week.Year = update.Year
	week.Split = update.Split
	week.WeekNumber = update.WeekNumber
	week.PublishDate = update.PublishDate
	week.Status = update.Status

	if err := h.db.Save(&week).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, week)
}
