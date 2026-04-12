package models

import (
	"time"

	"gorm.io/gorm"
)

type Region string

const (
	RegionLCS   Region = "LCS"
	RegionLEC   Region = "LEC"
	RegionLCK   Region = "LCK"
	RegionLPL   Region = "LPL"
	RegionCBLOL Region = "CBLOL"
	RegionLLA   Region = "LLA"
	RegionPCS   Region = "PCS"
	RegionVCS   Region = "VCS"
)

type Role string

const (
	RoleAdmin    Role = "admin"
	RolePollster Role = "pollster"
	RoleGeneral  Role = "general"
)

type Region string

const (
	RegionLCS   Region = "LCS"
	RegionLEC   Region = "LEC"
	RegionLCK   Region = "LCK"
	RegionLPL   Region = "LPL"
	RegionCBLOL Region = "CBLOL"
	RegionLLA   Region = "LLA"
	RegionPCS   Region = "PCS"
	RegionVCS   Region = "VCS"
)

type Split string

const (
	SplitSpring Split = "spring"
	SplitSummer Split = "summer"
)

type PollStatus string

const (
	PollStatusOpen      PollStatus = "open"
	PollStatusClosed    PollStatus = "closed"
	PollStatusPublished PollStatus = "published"
)

type Team struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	Name       string         `gorm:"size:100;not null" json:"name"`
	ShortName  string         `gorm:"size:10" json:"shortName"`
	Region     Region         `gorm:"size:10;not null" json:"region"`
	Logo       string         `gorm:"size:255" json:"logo"`
	ExternalID string         `gorm:"size:50" json:"externalId"`
}

type PollWeek struct {
	ID          uint       `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	Year        int        `gorm:"not null" json:"year"`
	Split       Split      `gorm:"size:10;not null" json:"split"`
	WeekNumber  int        `gorm:"not null" json:"weekNumber"`
	PublishDate time.Time  `json:"publishDate"`
	Status      PollStatus `gorm:"size:20;not null;default:'open'" json:"status"`
}

type Voter struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Outlet    string         `gorm:"size:100" json:"outlet"`
	Email     string         `gorm:"size:255;not null;uniqueIndex" json:"email"`
	Password  string         `gorm:"size:255" json:"-"`
	Role      Role           `gorm:"size:20;default:'general'" json:"role"`
	Region    Region         `gorm:"size:10" json:"region"`
	IsActive  bool           `gorm:"default:true" json:"isActive"`
}

type Vote struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	PollWeekID  uint      `gorm:"not null;index" json:"pollWeekId"`
	VoterID     uint      `gorm:"not null;index" json:"voterId"`
	Rankings    string    `gorm:"type:jsonb" json:"rankings"` // JSON array of {teamId, rank}
	SubmittedAt time.Time `json:"submittedAt"`
}

type Ranking struct {
	ID              uint `gorm:"primarykey" json:"id"`
	PollWeekID      uint `gorm:"not null;index" json:"pollWeekId"`
	TeamID          uint `gorm:"not null;index" json:"teamId"`
	Rank            int  `gorm:"not null" json:"rank"`
	Points          int  `gorm:"not null" json:"points"`
	FirstPlaceVotes int  `gorm:"default:0" json:"firstPlaceVotes"`
}

type Match struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"createdAt"`
	ExternalID string    `gorm:"size:50;uniqueIndex" json:"externalId"`
	Date       time.Time `json:"date"`
	Team1ID    uint      `gorm:"not null" json:"team1Id"`
	Team2ID    uint      `gorm:"not null" json:"team2Id"`
	Team1Score int       `gorm:"default:0" json:"team1Score"`
	Team2Score int       `gorm:"default:0" json:"team2Score"`
	Region     Region    `gorm:"size:10" json:"region"`
	League     string    `gorm:"size:20" json:"league"`
}

type ApplicationStatus string

const (
	ApplicationStatusPending  ApplicationStatus = "pending"
	ApplicationStatusApproved ApplicationStatus = "approved"
	ApplicationStatusRejected ApplicationStatus = "rejected"
)

type Application struct {
	ID        uint              `gorm:"primarykey" json:"id"`
	CreatedAt time.Time         `json:"createdAt"`
	Name      string            `gorm:"size:100;not null" json:"name"`
	Email     string            `gorm:"size:255;not null" json:"email"`
	Outlet    string            `gorm:"size:100" json:"outlet"`
	Region    Region            `gorm:"size:10" json:"region"`
	Notes     string            `gorm:"type:text" json:"notes"`
	Status    ApplicationStatus `gorm:"size:20;default:'pending'" json:"status"`
}
