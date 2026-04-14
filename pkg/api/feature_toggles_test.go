package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_GetFeatureTogglesMetadata(t *testing.T) {
	t.Run("returns feature metadata for signed-in user", func(t *testing.T) {
		server := SetupAPITestServer(t, func(_ *HTTPServer) {})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/feature-toggles/metadata"),
			userWithPermissions(1, nil),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var parsed struct {
			Items []struct {
				Name         string `json:"name"`
				Description  string `json:"description"`
				Stage        string `json:"stage"`
				FrontendOnly bool   `json:"frontendOnly"`
				Expression   string `json:"expression"`
			} `json:"items"`
		}
		require.NoError(t, json.Unmarshal(body, &parsed))
		require.NotEmpty(t, parsed.Items)

		for _, item := range parsed.Items {
			assert.NotEmpty(t, item.Name)
			assert.NotContains(t, item.Name, " ")
		}
	})

	t.Run("excludes restart-required toggles from response", func(t *testing.T) {
		server := SetupAPITestServer(t, func(_ *HTTPServer) {})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/feature-toggles/metadata"),
			userWithPermissions(1, nil),
		))
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var parsed struct {
			Items []struct {
				Name string `json:"name"`
			} `json:"items"`
		}
		require.NoError(t, json.Unmarshal(body, &parsed))

		names := make(map[string]bool)
		for _, item := range parsed.Items {
			names[item.Name] = true
		}
		assert.False(t, names["configurableSchedulerTick"], "restart-required flag should be omitted")
	})

	t.Run("excludes hideFromDocs toggles from response", func(t *testing.T) {
		server := SetupAPITestServer(t, func(_ *HTTPServer) {})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/feature-toggles/metadata"),
			userWithPermissions(1, nil),
		))
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var parsed struct {
			Items []struct {
				Name string `json:"name"`
			} `json:"items"`
		}
		require.NoError(t, json.Unmarshal(body, &parsed))

		for _, item := range parsed.Items {
			assert.NotEqual(t, "alertEnrichment", item.Name, "hideFromDocs flag should be omitted")
		}
	})

	t.Run("returns 401 when not signed in", func(t *testing.T) {
		server := SetupAPITestServer(t, func(_ *HTTPServer) {})

		res, err := server.Send(server.NewGetRequest("/api/feature-toggles/metadata"))
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})
}
