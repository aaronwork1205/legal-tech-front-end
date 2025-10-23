package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Conversation struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	Title     string    `gorm:"size:255;not null"`
	Summary   string    `gorm:"type:text"`
	Metadata  datatypes.JSONMap `gorm:"type:jsonb"`
	CreatedAt time.Time
	UpdatedAt time.Time
	User      User          `gorm:"constraint:OnDelete:CASCADE;"`
	Messages  []ChatMessage `gorm:"constraint:OnDelete:CASCADE;"`
}

func (c *Conversation) BeforeCreate(_ *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type ChatMessage struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	ConversationID uuid.UUID `gorm:"type:uuid;not null;index"`
	Role           string    `gorm:"size:32;not null"` // user or assistant
	Content        string    `gorm:"type:text;not null"`
	Metadata       datatypes.JSONMap `gorm:"type:jsonb"`
	Documents      datatypes.JSON    `gorm:"type:jsonb"` // Recommended documents
	CreatedAt      time.Time
	Conversation   Conversation `gorm:"constraint:OnDelete:CASCADE;"`
}

func (m *ChatMessage) BeforeCreate(_ *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
