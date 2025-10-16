package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VerificationToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	Code      string    `gorm:"size:16;not null;index"`
	ExpiresAt time.Time `gorm:"not null;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
	User      User `gorm:"constraint:OnDelete:CASCADE"`
}

func (t *VerificationToken) BeforeCreate(_ *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
