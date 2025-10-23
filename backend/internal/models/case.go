package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Case struct {
	ID          uuid.UUID         `gorm:"type:uuid;primaryKey"`
	UserID      uuid.UUID         `gorm:"type:uuid;not null;index"`
	Name        string            `gorm:"size:255;not null"`
	Priority    string            `gorm:"size:32;not null;default:Medium"`
	Status      string            `gorm:"size:32;not null;default:Draft"`
	MatterType  string            `gorm:"size:255"`
	Owner       string            `gorm:"size:255"`
	Summary     string            `gorm:"type:text"`
	AIFocus     string            `gorm:"size:255"`
	AIContext   datatypes.JSONMap `gorm:"type:jsonb"`
	Metadata    datatypes.JSONMap `gorm:"type:jsonb"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	User        User             `gorm:"constraint:OnDelete:CASCADE;"`
	Documents   []CaseDocument   `gorm:"constraint:OnDelete:CASCADE;"`
	Assignments []CaseAssignment `gorm:"constraint:OnDelete:CASCADE;"`
}

func (c *Case) BeforeCreate(_ *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type CaseDocument struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	CaseID      uuid.UUID `gorm:"type:uuid;not null;index"`
	Title       string    `gorm:"size:255;not null"`
	Owner       string    `gorm:"size:255"`
	Description string    `gorm:"type:text"`
	Status      string    `gorm:"size:64"`
	Category    string    `gorm:"size:64;not null;default:case"`
	StoragePath string    `gorm:"size:512"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Case        Case `gorm:"constraint:OnDelete:CASCADE;"`
}

func (d *CaseDocument) BeforeCreate(_ *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}
