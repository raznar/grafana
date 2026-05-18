package featuremgmt

import (
	"context"
	"fmt"
	"maps"
	"sync"

	"github.com/open-feature/go-sdk/openfeature"
	"github.com/open-feature/go-sdk/openfeature/memprovider"

	"github.com/grafana/grafana/pkg/setting"
)

var staticProvider = struct {
	sync.RWMutex
	provider *inMemoryBulkProvider
}{}

// inMemoryBulkProvider is a wrapper around memprovider.InMemoryProvider that
// also allows for bulk evaluation of flags, necessary to proxy OFREP requests.
type inMemoryBulkProvider struct {
	mu sync.RWMutex
	memprovider.InMemoryProvider
	flags map[string]memprovider.InMemoryFlag
}

func newInMemoryBulkProvider(flags map[string]memprovider.InMemoryFlag) *inMemoryBulkProvider {
	return &inMemoryBulkProvider{
		InMemoryProvider: memprovider.NewInMemoryProvider(flags),
		flags:            flags,
	}
}

// ListFlags returns a list of all flags registered with the provider.
func (p *inMemoryBulkProvider) ListFlags() ([]string, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	keys := make([]string, 0, len(p.flags))
	for key := range p.flags {
		keys = append(keys, key)
	}
	return keys, nil
}

func (p *inMemoryBulkProvider) BooleanEvaluation(ctx context.Context, flag string, defaultValue bool, flatCtx openfeature.FlattenedContext) openfeature.BoolResolutionDetail {
	p.mu.RLock()
	defer p.mu.RUnlock()

	return p.InMemoryProvider.BooleanEvaluation(ctx, flag, defaultValue, flatCtx)
}

func (p *inMemoryBulkProvider) StringEvaluation(ctx context.Context, flag string, defaultValue string, flatCtx openfeature.FlattenedContext) openfeature.StringResolutionDetail {
	p.mu.RLock()
	defer p.mu.RUnlock()

	return p.InMemoryProvider.StringEvaluation(ctx, flag, defaultValue, flatCtx)
}

func (p *inMemoryBulkProvider) FloatEvaluation(ctx context.Context, flag string, defaultValue float64, flatCtx openfeature.FlattenedContext) openfeature.FloatResolutionDetail {
	p.mu.RLock()
	defer p.mu.RUnlock()

	return p.InMemoryProvider.FloatEvaluation(ctx, flag, defaultValue, flatCtx)
}

func (p *inMemoryBulkProvider) IntEvaluation(ctx context.Context, flag string, defaultValue int64, flatCtx openfeature.FlattenedContext) openfeature.IntResolutionDetail {
	p.mu.RLock()
	defer p.mu.RUnlock()

	return p.InMemoryProvider.IntEvaluation(ctx, flag, defaultValue, flatCtx)
}

func (p *inMemoryBulkProvider) ObjectEvaluation(ctx context.Context, flag string, defaultValue any, flatCtx openfeature.FlattenedContext) openfeature.InterfaceResolutionDetail {
	p.mu.RLock()
	defer p.mu.RUnlock()

	return p.InMemoryProvider.ObjectEvaluation(ctx, flag, defaultValue, flatCtx)
}

func (p *inMemoryBulkProvider) SetBooleanFlag(name string, enabled bool) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.flags[name] = setting.NewInMemoryFlag(name, enabled)
	p.InMemoryProvider = memprovider.NewInMemoryProvider(p.flags)
}

func newStaticProvider(confFlags map[string]memprovider.InMemoryFlag, standardFlags []FeatureFlag) (openfeature.FeatureProvider, error) {
	flags := make(map[string]memprovider.InMemoryFlag, len(standardFlags))

	// Parse and add standard flags
	for _, flag := range standardFlags {
		inMemFlag, err := setting.ParseFlag(flag.Name, flag.Expression)
		if err != nil {
			return nil, fmt.Errorf("failed to parse flag %s: %w", flag.Name, err)
		}

		flags[flag.Name] = inMemFlag
	}

	// Add flags from config.ini file
	maps.Copy(flags, confFlags)

	provider := newInMemoryBulkProvider(flags)
	staticProvider.Lock()
	staticProvider.provider = provider
	staticProvider.Unlock()

	return provider, nil
}

func setStaticProviderBooleanFlag(name string, enabled bool) {
	staticProvider.RLock()
	provider := staticProvider.provider
	staticProvider.RUnlock()

	if provider != nil {
		provider.SetBooleanFlag(name, enabled)
	}
}
