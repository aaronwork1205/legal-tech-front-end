package http

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"lexiflow/backend/internal/config"
	"lexiflow/backend/internal/http/handlers"
)

func NewServer(cfg config.Config, db *gorm.DB) *gin.Engine {
	r := gin.Default()

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.CorsOrigins
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(corsConfig))

	r.GET("/healthz", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	authHandler := handlers.NewAuthHandler(db)
	authHandler.RegisterRoutes(api)
	caseHandler := handlers.NewCaseHandler(db, authHandler, cfg.UploadDir)
	caseHandler.RegisterRoutes(api)

	return r
}
