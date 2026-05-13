package overrides

import (
	"context"
	"errors"
	"time"

	"github.com/grafana/grafana/pkg/infra/db"
)

var errNilDB = errors.New("overrides store: db is nil")

type sqlStore struct {
	sql db.DB
	now func() time.Time
}

func newSQLStore(sql db.DB) *sqlStore {
	return &sqlStore{sql: sql, now: time.Now}
}

func (s *sqlStore) list(ctx context.Context) (map[string]bool, error) {
	if s == nil || s.sql == nil {
		return nil, errNilDB
	}
	result := make(map[string]bool)
	err := s.sql.WithDbSession(ctx, func(sess *db.Session) error {
		var rows []FeatureToggleOverride
		if err := sess.Find(&rows); err != nil {
			return err
		}
		for _, row := range rows {
			result[row.Name] = row.Enabled
		}
		return nil
	})
	return result, err
}

func (s *sqlStore) upsert(ctx context.Context, name string, enabled bool, userID int64) error {
	if s == nil || s.sql == nil {
		return errNilDB
	}
	now := s.now().UTC()
	return s.sql.WithTransactionalDbSession(ctx, func(sess *db.Session) error {
		var existing FeatureToggleOverride
		has, err := sess.Where("name = ?", name).Get(&existing)
		if err != nil {
			return err
		}
		if has {
			existing.Enabled = enabled
			existing.UpdatedBy = userID
			existing.Updated = now
			_, err = sess.ID(existing.ID).Cols("enabled", "updated_by", "updated").Update(&existing)
			return err
		}
		row := FeatureToggleOverride{
			Name:      name,
			Enabled:   enabled,
			UpdatedBy: userID,
			Updated:   now,
		}
		_, err = sess.Insert(&row)
		return err
	})
}

func (s *sqlStore) delete(ctx context.Context, name string) error {
	if s == nil || s.sql == nil {
		return errNilDB
	}
	return s.sql.WithDbSession(ctx, func(sess *db.Session) error {
		_, err := sess.Exec("DELETE FROM feature_toggle_override WHERE name = ?", name)
		return err
	})
}

func (s *sqlStore) applyBatch(ctx context.Context, removes []string, updates []BatchUpdate, userID int64) error {
	if s == nil || s.sql == nil {
		return errNilDB
	}
	return s.sql.InTransaction(ctx, func(txCtx context.Context) error {
		for _, name := range removes {
			if err := s.delete(txCtx, name); err != nil {
				return err
			}
		}
		for _, u := range updates {
			if err := s.upsert(txCtx, u.Name, u.Enabled, userID); err != nil {
				return err
			}
		}
		return nil
	})
}
