# syntax=docker/dockerfile:1.7

FROM golang:1.21-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server main.go

FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=builder /src/server ./server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/server"] 
