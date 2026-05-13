package overrides

import "time"

// FeatureToggleOverride is a persisted operator override for a feature flag name.
type FeatureToggleOverride struct {
	ID        int64     `xorm:"pk autoincr 'id'"`
	Name      string    `xorm:"name"`
	Enabled   bool      `xorm:"enabled"`
	UpdatedBy int64     `xorm:"updated_by"`
	Updated   time.Time `xorm:"updated"`
}
