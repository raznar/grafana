package overrides

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/tests/testsuite"
)

func TestMain(m *testing.M) {
	testsuite.Run(m)
}

func TestService_UpsertListDelete(t *testing.T) {
	sqlStore := db.InitTestDB(t)
	svc := ProvideService(sqlStore)
	ctx := context.Background()

	m, err := svc.List(ctx)
	require.NoError(t, err)
	require.Empty(t, m)

	require.NoError(t, svc.Upsert(ctx, "testFlag", true, 42))
	m, err = svc.List(ctx)
	require.NoError(t, err)
	require.True(t, m["testFlag"])

	require.NoError(t, svc.Upsert(ctx, "testFlag", false, 43))
	m, err = svc.List(ctx)
	require.NoError(t, err)
	require.False(t, m["testFlag"])

	require.NoError(t, svc.Delete(ctx, "testFlag"))
	m, err = svc.List(ctx)
	require.NoError(t, err)
	require.Empty(t, m)
}
