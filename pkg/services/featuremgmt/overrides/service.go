package overrides

import (
	"context"

	"github.com/grafana/grafana/pkg/infra/db"
)

// Service persists feature toggle overrides in the SQL database.
type Service interface {
	List(ctx context.Context) (map[string]bool, error)
	Upsert(ctx context.Context, name string, enabled bool, userID int64) error
	Delete(ctx context.Context, name string) error
}

// ProvideService returns an overrides Service backed by sqlStore.
func ProvideService(sql db.DB) Service {
	return &ServiceImpl{store: newSQLStore(sql)}
}

// ServiceImpl implements Service.
type ServiceImpl struct {
	store *sqlStore
}

func (s *ServiceImpl) List(ctx context.Context) (map[string]bool, error) {
	return s.store.list(ctx)
}

func (s *ServiceImpl) Upsert(ctx context.Context, name string, enabled bool, userID int64) error {
	return s.store.upsert(ctx, name, enabled, userID)
}

func (s *ServiceImpl) Delete(ctx context.Context, name string) error {
	return s.store.delete(ctx, name)
}
