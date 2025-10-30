package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CaseAssignment struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	CaseID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_case_lawyer"`
	LawyerID  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_case_lawyer"`
	Notes     string    `gorm:"size:512"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Case      Case `gorm:"constraint:OnDelete:CASCADE;"`
	Lawyer    User `gorm:"constraint:OnDelete:CASCADE;"`
}

func (a *CaseAssignment) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
