package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"lexiflow/backend/internal/models"
)

func Connect(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.VerificationToken{},
		&models.Case{},
		&models.CaseDocument{},
	); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	return db
}
