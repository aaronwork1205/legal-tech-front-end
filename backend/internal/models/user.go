package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	UserRoleClient = "client"
	UserRoleLawyer = "lawyer"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	CompanyName  string    `gorm:"size:255;not null"`
	Email        string    `gorm:"size:255;uniqueIndex;not null"`
	PasswordHash string    `gorm:"size:255;not null"`
	Subscription string    `gorm:"size:50;not null;default:starter"`
	Verified     bool      `gorm:"not null;default:false"`
	Role         string    `gorm:"size:32;not null;default:client"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	if u.Role == "" {
		u.Role = UserRoleClient
	}
	return nil
}
