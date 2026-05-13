package migrations

import "github.com/grafana/grafana/pkg/services/sqlstore/migrator"

func addFeatureToggleOverrideMigration(mg *migrator.Migrator) {
	featureToggleOverrideV1 := migrator.Table{
		Name: "feature_toggle_override",
		Columns: []*migrator.Column{
			{Name: "id", Type: migrator.DB_BigInt, IsPrimaryKey: true, IsAutoIncrement: true},
			{Name: "name", Type: migrator.DB_NVarchar, Length: 190, Nullable: false},
			{Name: "enabled", Type: migrator.DB_Bool, Nullable: false, Default: "0"},
			{Name: "updated_by", Type: migrator.DB_BigInt, Nullable: true},
			{Name: "updated", Type: migrator.DB_DateTime, Nullable: false},
		},
		Indices: []*migrator.Index{
			{Cols: []string{"name"}, Type: migrator.UniqueIndex},
		},
	}

	mg.AddMigration("create feature_toggle_override table", migrator.NewAddTableMigration(featureToggleOverrideV1))
	mg.AddMigration("add unique index feature_toggle_override.name", migrator.NewAddIndexMigration(featureToggleOverrideV1, featureToggleOverrideV1.Indices[0]))
}
