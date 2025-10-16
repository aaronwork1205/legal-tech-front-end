package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	Port        string
	DatabaseURL string
	CorsOrigins []string
}

func Load() Config {
	port := getEnv("PORT", "8080")
	databaseURL := getEnv("DATABASE_URL", "postgres://lexiflow:lexiflow@localhost:5432/lexiflow?sslmode=disable")
	cors := getEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")

	origins := []string{}
	for _, origin := range strings.Split(cors, ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	if databaseURL == "" {
		log.Fatal("DATABASE_URL must be provided")
	}

	return Config{
		Port:        port,
		DatabaseURL: databaseURL,
		CorsOrigins: origins,
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
