package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Session struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID       uuid.UUID `gorm:"type:uuid;not null;index"`
	Token        string    `gorm:"size:255;uniqueIndex;not null"`
	UserAgent    string    `gorm:"size:255"`
	IP           string    `gorm:"size:64"`
	LastActivity time.Time `gorm:"not null;index"`
	ExpiresAt    time.Time `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	User         User `gorm:"constraint:OnDelete:CASCADE"`
}

func (s *Session) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
