# Directory Structure

```
src/
  app/
    (shell)/
      (portal)/
        (account)/
          (dashboard)/
            dashboard/
              @header/
                default.tsx (2 lines)
              @modal/
                (.)account/
                  new/
                    page.tsx (14 lines)
                default.tsx (1 lines)
              account/
                audit/
                  page.tsx (1 lines)
                daily/
                  page.tsx (1 lines)
                matrix/
                  page.tsx (2 lines)
                members/
                  page.tsx (2 lines)
                new/
                  page.tsx (5 lines)
                partners/
                  [id]/
                    page.tsx (2 lines)
                  page.tsx (2 lines)
                settings/
                  page.tsx (2 lines)
                teams/
                  [id]/
                    page.tsx (2 lines)
                  page.tsx (2 lines)
                workforce-scheduling/
                  page.tsx (5 lines)
              layout.tsx (9 lines)
              page.tsx (2 lines)
          (workspaces)/
            workspaces/
              [id]/
                @businesstab/
                  acceptance/
                    page.tsx (2 lines)
                  audit/
                    loading.tsx (2 lines)
                    page.tsx (2 lines)
                  capabilities/
                    page.tsx (2 lines)
                  daily/
                    loading.tsx (2 lines)
                    page.tsx (2 lines)
                  document-parser/
                    page.tsx (2 lines)
                  files/
                    page.tsx (2 lines)
                  finance/
                    page.tsx (2 lines)
                  issues/
                    page.tsx (2 lines)
                  members/
                    page.tsx (2 lines)
                  quality-assurance/
                    page.tsx (2 lines)
                  schedule/
                    loading.tsx (2 lines)
                    page.tsx (2 lines)
                  tasks/
                    loading.tsx (2 lines)
                    page.tsx (2 lines)
                  timeline/
                    page.tsx (5 lines)
                  default.tsx (1 lines)
                  error.tsx (10 lines)
                  loading.tsx (2 lines)
                @modal/
                  (.)daily-log/
                    [logId]/
                      page.tsx (9 lines)
                  (.)schedule-proposal/
                    page.tsx (2 lines)
                  (.)settings/
                    page.tsx (15 lines)
                  default.tsx (1 lines)
                @panel/
                  (.)governance/
                    page.tsx (8 lines)
                  default.tsx (1 lines)
                daily-log/
                  [logId]/
                    page.tsx (23 lines)
                governance/
                  page.tsx (9 lines)
                locations/
                  page.tsx (8 lines)
                schedule-proposal/
                  page.tsx (2 lines)
                settings/
                  page.tsx (15 lines)
                layout.tsx (6 lines)
                page.tsx (6 lines)
              @header/
                default.tsx (2 lines)
              @modal/
                (.)new/
                  page.tsx (3 lines)
                default.tsx (1 lines)
              new/
                page.tsx (3 lines)
              layout.tsx (9 lines)
              page.tsx (2 lines)
          layout.tsx (2 lines)
        layout.tsx (8 lines)
        page.tsx (5 lines)
      (public)/
        @modal/
          (.)reset-password/
            page.tsx (19 lines)
          default.tsx (1 lines)
        login/
          page.tsx (2 lines)
        reset-password/
          page.tsx (6 lines)
        layout.tsx (8 lines)
      @modal/
        default.tsx (1 lines)
      @sidebar/
        default.tsx (2 lines)
      layout.tsx (11 lines)
    layout.tsx (15 lines)
  app-runtime/
    ai/
      flows/
        adapt-ui-color-to-account-context.ts (13 lines)
        extract-invoice-items.ts (9 lines)
      schemas/
        docu-parse.ts (3 lines)
      dev.ts (1 lines)
      genkit.ts (2 lines)
      index.ts (0 lines)
    contexts/
      account-context.ts (28 lines)
      app-context.ts (23 lines)
      auth-context.ts (14 lines)
      firebase-context.ts (11 lines)
      i18n-context.ts (9 lines)
      index.ts (0 lines)
      README.MD (5 lines)
    providers/
      account-provider.queries.ts (36 lines)
      account-provider.tsx (13 lines)
      app-provider.queries.ts (14 lines)
      app-provider.tsx (7 lines)
      auth-provider.tsx (12 lines)
      firebase-provider.tsx (8 lines)
      i18n-provider.tsx (12 lines)
      index.ts (0 lines)
      README.MD (5 lines)
      theme-provider.tsx (3 lines)
  config/
    i18n/
      i18n-provider.tsx (0 lines)
      i18n-types.ts (6 lines)
      i18n.schema.ts (236 lines)
      i18n.ts (5 lines)
  features/
    account.slice/
      gov.policy/
        _hooks/
          use-account-policy.ts (4 lines)
        _actions.ts (46 lines)
        _queries.ts (10 lines)
        index.ts (0 lines)
      gov.role/
        _components/
          permission-matrix-view.tsx (7 lines)
          permission-tree.tsx (11 lines)
        _hooks/
          use-account-role.ts (4 lines)
        _actions.ts (46 lines)
        _queries.ts (12 lines)
        index.ts (0 lines)
      user.profile/
        _components/
          account-settings-router.tsx (4 lines)
          account-skills-section.tsx (6 lines)
          email-card.tsx (13 lines)
          preferences-card.tsx (6 lines)
          profile-card.tsx (37 lines)
          security-card.tsx (7 lines)
          user-settings-view.tsx (7 lines)
          user-settings.tsx (15 lines)
        _hooks/
          use-user.ts (12 lines)
        _actions.ts (24 lines)
        _queries.ts (10 lines)
        index.ts (0 lines)
      user.wallet/
        _hooks/
          use-wallet.ts (7 lines)
        _actions.ts (33 lines)
        _queries.ts (23 lines)
        index.ts (0 lines)
      _account.rules.ts (4 lines)
      index.ts (0 lines)
    global-search.slice/
      _components/
        global-search-dialog.tsx (25 lines)
      _actions.ts (14 lines)
      _services.ts (10 lines)
      _types.ts (48 lines)
      index.ts (0 lines)
    identity.slice/
      _components/
        auth-background.tsx (1 lines)
        auth-tabs-root.tsx (22 lines)
        login-form.tsx (16 lines)
        login-view.tsx (11 lines)
        register-form.tsx (19 lines)
        reset-password-dialog.tsx (13 lines)
        reset-password-form.tsx (15 lines)
      _actions.ts (21 lines)
      _claims-handler.ts (13 lines)
      _token-refresh-listener.ts (8 lines)
      index.ts (0 lines)
    infra.dlq-manager/
      _dlq.ts (12 lines)
      index.ts (0 lines)
    infra.event-router/
      _router.ts (19 lines)
      index.ts (0 lines)
    infra.external-triggers/
      _guard.ts (64 lines)
      index.ts (0 lines)
    infra.gateway-command/
      _gateway.ts (32 lines)
      index.ts (0 lines)
    infra.gateway-query/
      _registry.ts (20 lines)
      index.ts (0 lines)
    infra.outbox-relay/
      _relay.ts (52 lines)
      index.ts (0 lines)
    notification-hub.slice/
      _components/
        notification-bell.tsx (17 lines)
      _services/
        notification-listener.ts (20 lines)
      gov.notification-router/
        _router.ts (6 lines)
        index.ts (0 lines)
      user.notification/
        _components/
          notification-badge.tsx (8 lines)
          notification-list.tsx (7 lines)
        _hooks/
          use-user-notifications.ts (5 lines)
        _delivery.ts (48 lines)
        _queries.ts (21 lines)
        index.ts (0 lines)
      _actions.ts (28 lines)
      _contract.ts (7 lines)
      _notification-authority.ts (1 lines)
      _services.ts (52 lines)
      _types.ts (68 lines)
      index.ts (0 lines)
    observability/
      _error-log.ts (8 lines)
      _metrics.ts (3 lines)
      _trace.ts (7 lines)
      index.ts (0 lines)
    organization.slice/
      core/
        _components/
          account-grid.tsx (19 lines)
          account-new-form.tsx (16 lines)
          org-settings-view.tsx (6 lines)
          org-settings.tsx (17 lines)
        _hooks/
          use-organization-management.ts (10 lines)
        _actions.ts (27 lines)
        _queries.ts (9 lines)
        index.ts (0 lines)
      core.event-bus/
        _bus.ts (17 lines)
        _events.ts (126 lines)
        index.ts (0 lines)
      gov.members/
        _components/
          members-view.tsx (15 lines)
        _hooks/
          use-member-management.ts (8 lines)
        _actions.ts (20 lines)
        _queries.ts (9 lines)
        index.ts (0 lines)
      gov.partners/
        _components/
          partner-detail-view.tsx (36 lines)
          partners-view.tsx (26 lines)
        _hooks/
          use-partner-management.ts (9 lines)
        _actions.ts (25 lines)
        _queries.ts (13 lines)
        index.ts (0 lines)
      gov.policy/
        _hooks/
          use-org-policy.ts (4 lines)
        _actions.ts (46 lines)
        _queries.ts (13 lines)
        index.ts (0 lines)
      gov.teams/
        _components/
          team-detail-view.tsx (14 lines)
          teams-view.tsx (25 lines)
        _hooks/
          use-team-management.ts (7 lines)
        _actions.ts (20 lines)
        _queries.ts (9 lines)
        index.ts (0 lines)
      index.ts (0 lines)
    portal.slice/
      core/
        _hooks/
          use-portal-state.ts (3 lines)
      _types.ts (3 lines)
      index.ts (0 lines)
    projection.bus/
      account-audit/
        _projector.ts (20 lines)
        _queries.ts (9 lines)
        index.ts (0 lines)
      account-schedule/
        _projector.ts (33 lines)
        _queries.ts (8 lines)
        index.ts (0 lines)
      account-view/
        _projector.ts (40 lines)
        _queries.ts (10 lines)
        index.ts (0 lines)
      demand-board/
        _projector.ts (35 lines)
        index.ts (0 lines)
      global-audit-view/
        _projector.ts (23 lines)
        _queries.ts (10 lines)
        index.ts (0 lines)
      org-eligible-member-view/
        _projector.ts (43 lines)
        _queries.ts (35 lines)
        index.ts (0 lines)
      organization-view/
        _projector.ts (36 lines)
        _queries.ts (4 lines)
        index.ts (0 lines)
      tag-snapshot/
        _projector.ts (26 lines)
        _queries.ts (7 lines)
        index.ts (0 lines)
      wallet-balance/
        _projector.ts (32 lines)
        _queries.ts (6 lines)
        index.ts (0 lines)
      workspace-scope-guard/
        _projector.ts (18 lines)
        _queries.ts (11 lines)
        _read-model.ts (22 lines)
        index.ts (0 lines)
      workspace-view/
        _projector.ts (29 lines)
        _queries.ts (4 lines)
        index.ts (0 lines)
      _funnel.shared.ts (7 lines)
      _funnel.ts (11 lines)
      _organization-funnel.ts (20 lines)
      _query-registration.ts (6 lines)
      _registry.ts (14 lines)
      _tag-funnel.ts (10 lines)
      _workspace-funnel.ts (9 lines)
      index.ts (0 lines)
    semantic-graph.slice/
      centralized-causality/
        causality-tracer.ts (41 lines)
      centralized-edges/
        adjacency-list.ts (12 lines)
        context-attention.ts (9 lines)
        semantic-edge-store.ts (27 lines)
        weight-calculator.ts (20 lines)
      centralized-embeddings/
        embedding-port.ts (22 lines)
        vector-store.ts (15 lines)
      centralized-guards/
        invariant-guard.ts (34 lines)
        semantic-guard.ts (34 lines)
        staleness-monitor.ts (10 lines)
      centralized-learning/
        decay-service.ts (11 lines)
        learning-engine.ts (21 lines)
      centralized-neural-net/
        context-attention.ts (0 lines)
        neural-network.ts (29 lines)
      centralized-nodes/
        hierarchy-manager.ts (7 lines)
        tag-entity.factory.ts (23 lines)
      centralized-tag/
        _actions.ts (49 lines)
        _bus.ts (17 lines)
        _events.ts (8 lines)
        index.ts (0 lines)
      centralized-types/
        index.ts (138 lines)
      centralized-utils/
        semantic-utils.ts (11 lines)
      centralized-workflows/
        dispatch-bridge/
          index.ts (26 lines)
        policy-mapper/
          index.ts (24 lines)
        workflows/
          alert-routing-flow.ts (35 lines)
          tag-promotion-flow.ts (27 lines)
        tag-lifecycle.workflow.ts (47 lines)
      consensus-engine/
        index.ts (28 lines)
      outbox/
        tag-outbox.ts (28 lines)
      projections/
        context-selectors.ts (0 lines)
        graph-selectors.ts (26 lines)
        tag-snapshot.slice.ts (16 lines)
      proposal-stream/
        index.ts (26 lines)
      relationship-visualizer/
        index.ts (36 lines)
      subscribers/
        lifecycle-subscriber.ts (8 lines)
      wiki-editor/
        index.ts (21 lines)
      _actions.ts (59 lines)
      _aggregate.ts (43 lines)
      _cost-classifier.ts (20 lines)
      _queries.ts (20 lines)
      _semantic-authority.ts (1 lines)
      _services.ts (17 lines)
      _types.ts (68 lines)
      index.ts (0 lines)
    skill-xp.slice/
      _components/
        personal-skill-panel.tsx (21 lines)
      _actions.ts (39 lines)
      _aggregate.ts (27 lines)
      _ledger.ts (13 lines)
      _org-recognition.ts (31 lines)
      _projector.ts (28 lines)
      _queries.ts (27 lines)
      _tag-lifecycle.ts (29 lines)
      _tag-pool.ts (46 lines)
      index.ts (0 lines)
    timelineing.slice/
      _actions/
        index.ts (13 lines)
      _components/
        timeline-canvas.tsx (46 lines)
        timeline-capability-tabs.tsx (8 lines)
        timeline.account-view.tsx (7 lines)
        timeline.workspace-view.tsx (6 lines)
      _hooks/
        index.ts (0 lines)
        use-account-timeline.ts (6 lines)
        use-timeline-commands.ts (7 lines)
        use-workspace-timeline.ts (7 lines)
      _queries.ts (18 lines)
      _types.ts (4 lines)
      index.ts (0 lines)
    workforce-scheduling.slice/
      _actions/
        governance.ts (42 lines)
        index.ts (0 lines)
        lifecycle.ts (27 lines)
        workspace.ts (35 lines)
      _components/
        decision-history-columns.tsx (7 lines)
        demand-board.tsx (54 lines)
        governance-sidebar.tsx (13 lines)
        org-schedule-governance.confirmed-row.tsx (16 lines)
        org-schedule-governance.proposal-row.tsx (21 lines)
        org-schedule-governance.rows.tsx (0 lines)
        org-schedule-governance.shared.tsx (31 lines)
        org-schedule-governance.tsx (11 lines)
        org-skill-pool-manager.tsx (17 lines)
        proposal-dialog.tsx (75 lines)
        schedule-capability-tabs.tsx (8 lines)
        schedule-data-table.tsx (36 lines)
        schedule-proposal-content.tsx (21 lines)
        schedule.account-view.tsx (38 lines)
        schedule.workspace-view.tsx (9 lines)
        unified-calendar-grid.tsx (47 lines)
        unified-calendar-grid.utils.ts (17 lines)
        upcoming-events-columns.tsx (16 lines)
      _hooks/
        index.ts (0 lines)
        use-global-schedule.ts (11 lines)
        use-org-schedule.ts (9 lines)
        use-schedule-commands.ts (16 lines)
        use-schedule-event-handler.ts (4 lines)
        use-workspace-schedule.ts (12 lines)
      _projectors/
        account-schedule-queries.ts (0 lines)
        account-schedule.ts (17 lines)
        demand-board-queries.ts (20 lines)
        demand-board.ts (0 lines)
      policy-mapper/
        index.ts (34 lines)
      _actions.ts (0 lines)
      _aggregate.ts (60 lines)
      _aggregate.types.ts (13 lines)
      _eligibility.ts (17 lines)
      _queries.ts (73 lines)
      _saga.ts (50 lines)
      _schedule.rules.ts (6 lines)
      _selectors.ts (26 lines)
      _write-op.ts (3 lines)
      index.ts (0 lines)
    workspace.slice/
      application/
        _command-handler.ts (19 lines)
        _org-policy-cache.ts (15 lines)
        _outbox.ts (46 lines)
        _policy-engine.ts (7 lines)
        _scope-guard.ts (10 lines)
        _transaction-runner.ts (18 lines)
        index.ts (0 lines)
      business.acceptance/
        _components/
          acceptance-view.tsx (13 lines)
        index.ts (0 lines)
      business.daily/
        _components/
          actions/
            bookmark-button.tsx (8 lines)
            comment-button.tsx (6 lines)
            like-button.tsx (13 lines)
            share-button.tsx (19 lines)
          composer.tsx (21 lines)
          daily-log-card.tsx (20 lines)
          daily-log-dialog.tsx (31 lines)
          daily.account-view.tsx (11 lines)
          daily.view.tsx (2 lines)
          daily.workspace-view.tsx (8 lines)
          image-carousel.tsx (12 lines)
        _hooks/
          use-aggregated-logs.ts (4 lines)
          use-bookmark-commands.ts (6 lines)
          use-daily-commands.ts (6 lines)
          use-daily-upload.ts (4 lines)
          use-workspace-daily.ts (12 lines)
        _actions.ts (20 lines)
        _bookmark-actions.ts (9 lines)
        _queries.ts (24 lines)
        _types.ts (30 lines)
        index.ts (0 lines)
      business.document-parser/
        _components/
          document-parser-tables.tsx (32 lines)
          document-parser-view.tsx (45 lines)
        _form-actions.ts (20 lines)
        _intent-actions.ts (136 lines)
        _queries.ts (8 lines)
        _types.ts (63 lines)
        index.ts (0 lines)
      business.files/
        _components/
          files-view.tsx (69 lines)
        _hooks/
          use-storage.ts (7 lines)
          use-workspace-filters.ts (6 lines)
        _actions.ts (28 lines)
        _queries.ts (9 lines)
        _storage-actions.ts (25 lines)
        _types.ts (18 lines)
        index.ts (0 lines)
      business.finance/
        _components/
          finance-item-table.tsx (16 lines)
          finance-lifecycle-tracker.tsx (16 lines)
          finance-view.tsx (18 lines)
        _hooks/
          use-finance-lifecycle.helpers.ts (39 lines)
          use-finance-lifecycle.ts (37 lines)
        _services/
          finance-aggregate-query-gateway.ts (15 lines)
          finance-strong-read.ts (10 lines)
        _actions.ts (7 lines)
        _constants.ts (3 lines)
        _queries.ts (7 lines)
        _types.ts (50 lines)
        index.ts (0 lines)
      business.issues/
        _components/
          issues-view.tsx (23 lines)
        _actions.ts (27 lines)
        _types.ts (17 lines)
        index.ts (0 lines)
      business.parsing-intent/
        _architecture-test-helpers.ts (2 lines)
        _contract.ts (56 lines)
        index.ts (0 lines)
      business.quality-assurance/
        _components/
          quality-assurance-view.tsx (13 lines)
        index.ts (0 lines)
      business.tasks/
        _actions/
          helpers.ts (30 lines)
          index.ts (57 lines)
        _components/
          attachments-action.tsx (8 lines)
          attachments-dialog.tsx (23 lines)
          location-action.tsx (8 lines)
          location-dialog.tsx (31 lines)
          progress-report-dialog.tsx (28 lines)
          task-editor-dialog.tsx (64 lines)
          task-tree-node.tsx (27 lines)
          tasks-view.tsx (72 lines)
        _hooks/
          index.ts (0 lines)
          use-attachments-dialog-controller.ts (18 lines)
          use-location-dialog-controller.ts (15 lines)
        _queries.ts (22 lines)
        _types.ts (36 lines)
        index.ts (0 lines)
      business.workflow/
        _aggregate.ts (37 lines)
        _issue-handler.ts (24 lines)
        _persistence.ts (29 lines)
        _stage-transition.ts (13 lines)
        _workflow.constants.ts (3 lines)
        index.ts (0 lines)
      core/
        _components/
          shell/
            account-create-dialog.tsx (27 lines)
            account-switcher.tsx (35 lines)
            dashboard-sidebar.tsx (22 lines)
            header.tsx (26 lines)
            index.ts (0 lines)
            nav-main.tsx (39 lines)
            nav-user.tsx (28 lines)
            nav-workspaces.tsx (17 lines)
            notification-center.tsx (10 lines)
            theme-adapter.tsx (11 lines)
          create-workspace-dialog.tsx (21 lines)
          dashboard-view.tsx (11 lines)
          stat-cards.tsx (7 lines)
          workflow-blockers-state.ts (19 lines)
          workspace-capabilities.tsx (54 lines)
          workspace-card.tsx (70 lines)
          workspace-context.types.ts (22 lines)
          workspace-grid-view.tsx (6 lines)
          workspace-list-header.tsx (26 lines)
          workspace-list.tsx (15 lines)
          workspace-locations-panel.tsx (29 lines)
          workspace-nav-tabs.tsx (10 lines)
          workspace-provider.tsx (53 lines)
          workspace-settings.tsx (340 lines)
          workspace-status-bar.tsx (5 lines)
          workspace-table-view.tsx (11 lines)
          workspaces-view.tsx (12 lines)
        _hooks/
          use-account.ts (3 lines)
          use-app.ts (0 lines)
          use-visible-workspaces.ts (6 lines)
          use-workspace-commands.ts (4 lines)
          use-workspace-event-handler.tsx (40 lines)
          workspace-import-handler.tsx (23 lines)
        _actions.ts (76 lines)
        _queries.ts (19 lines)
        _types.ts (54 lines)
        _use-cases.ts (21 lines)
        index.ts (0 lines)
      core.event-bus/
        _hooks/
          _context.ts (11 lines)
        _bus.ts (14 lines)
        _context.ts (0 lines)
        _event-funnel.ts (0 lines)
        _events.ts (172 lines)
        index.ts (0 lines)
      core.event-store/
        _store.ts (13 lines)
        index.ts (0 lines)
      gov.audit/
        _components/
          audit-detail-sheet.tsx (9 lines)
          audit-event-item.tsx (12 lines)
          audit-timeline.tsx (12 lines)
          audit-type-icon.tsx (6 lines)
          audit.account-view.tsx (5 lines)
          audit.view.tsx (2 lines)
          audit.workspace-view.tsx (12 lines)
        _hooks/
          use-account-audit.ts (5 lines)
          use-logger.ts (8 lines)
          use-workspace-audit.ts (4 lines)
        _actions.ts (22 lines)
        _queries.ts (9 lines)
        _types.ts (19 lines)
        index.ts (0 lines)
      gov.audit-convergence/
        _bridge.ts (15 lines)
        index.ts (0 lines)
      gov.members/
        _components/
          members-panel.tsx (33 lines)
        _queries.ts (7 lines)
        index.ts (0 lines)
      gov.partners/
        index.ts (0 lines)
      gov.role/
        _hooks/
          use-workspace-role.ts (4 lines)
        _actions.ts (22 lines)
        _queries.ts (8 lines)
        _types.ts (12 lines)
        index.ts (0 lines)
      gov.teams/
        index.ts (0 lines)
      _task.rules.ts (10 lines)
      _workspace.rules.ts (19 lines)
      index.ts (0 lines)
  portal/
    index.ts (0 lines)
    portal-layout.tsx (5 lines)
  shadcn-ui/
    custom-ui/
      language-switcher.tsx (14 lines)
      page-header.tsx (15 lines)
    hooks/
      use-mobile.tsx (3 lines)
      use-toast.ts (46 lines)
    lib/
      utils.ts (0 lines)
    utils/
      utils.ts (5 lines)
    accordion.tsx (2 lines)
    alert-dialog.tsx (4 lines)
    alert.tsx (4 lines)
    aspect-ratio.tsx (0 lines)
    avatar.tsx (1 lines)
    badge.tsx (9 lines)
    breadcrumb.tsx (5 lines)
    button-group.tsx (6 lines)
    button.tsx (11 lines)
    calendar.tsx (10 lines)
    card.tsx (1 lines)
    carousel.tsx (28 lines)
    chart.tsx (22 lines)
    checkbox.tsx (2 lines)
    collapsible.tsx (0 lines)
    command.tsx (7 lines)
    context-menu.tsx (4 lines)
    dialog.tsx (4 lines)
    drawer.tsx (4 lines)
    dropdown-menu.tsx (4 lines)
    empty.tsx (11 lines)
    field.tsx (7 lines)
    form.tsx (31 lines)
    hover-card.tsx (1 lines)
    input-group.tsx (9 lines)
    input-otp.tsx (5 lines)
    input.tsx (1 lines)
    item.tsx (11 lines)
    kbd.tsx (3 lines)
    label.tsx (2 lines)
    menubar.tsx (4 lines)
    navigation-menu.tsx (7 lines)
    pagination.tsx (14 lines)
    popover.tsx (1 lines)
    progress.tsx (1 lines)
    radio-group.tsx (4 lines)
    scroll-area.tsx (3 lines)
    select.tsx (2 lines)
    separator.tsx (1 lines)
    sheet.tsx (5 lines)
    sidebar.tsx (43 lines)
    skeleton.tsx (7 lines)
    slider.tsx (1 lines)
    sonner.tsx (10 lines)
    spinner.tsx (5 lines)
    switch.tsx (3 lines)
    table.tsx (1 lines)
    tabs.tsx (1 lines)
    textarea.tsx (3 lines)
    timeline.tsx (11 lines)
    toast.tsx (3 lines)
    toaster.tsx (9 lines)
    toggle-group.tsx (3 lines)
    toggle.tsx (2 lines)
    tooltip.tsx (3 lines)
  shared/
    infra/
      analytics/
        analytics.adapter.ts (3 lines)
        analytics.client.ts (2 lines)
      auth/
        auth.adapter.ts (12 lines)
        auth.client.ts (2 lines)
        auth.types.ts (4 lines)
        index.ts (0 lines)
      firestore/
        repositories/
          account.repository.ts (26 lines)
          audit.repository.ts (16 lines)
          daily.repository.ts (33 lines)
          index.ts (0 lines)
          projection.registry.repository.ts (22 lines)
          schedule.repository.ts (49 lines)
          user.repository.ts (19 lines)
          workspace-business.document-parser.repository.ts (42 lines)
          workspace-business.files.repository.ts (31 lines)
          workspace-business.finance.repository.ts (38 lines)
          workspace-business.issues.repository.ts (36 lines)
          workspace-business.parsing-imports.repository.ts (22 lines)
          workspace-business.tasks.repository.ts (60 lines)
          workspace-core.event-store.repository.ts (27 lines)
          workspace-core.repository.ts (87 lines)
        collection-paths.ts (0 lines)
        firestore.client.ts (2 lines)
        firestore.converter.ts (14 lines)
        firestore.facade.ts (0 lines)
        firestore.read.adapter.ts (41 lines)
        firestore.types.ts (17 lines)
        firestore.utils.ts (2 lines)
        firestore.write.adapter.ts (31 lines)
        index.ts (0 lines)
        version-guard.middleware.ts (9 lines)
      messaging/
        index.ts (0 lines)
        messaging.adapter.ts (0 lines)
        messaging.client.ts (2 lines)
        messaging.types.ts (11 lines)
      storage/
        index.ts (0 lines)
        storage-path.resolver.ts (4 lines)
        storage.adapter.ts (8 lines)
        storage.client.ts (2 lines)
        storage.facade.ts (21 lines)
        storage.read.adapter.ts (4 lines)
        storage.types.ts (10 lines)
        storage.write.adapter.ts (14 lines)
      app.client.ts (2 lines)
      firebase.config.ts (0 lines)
      index.ts (0 lines)
  shared-infra/
    backend-firebase/
      functions/
        src/
          claims/
            claims-refresh.fn.ts (13 lines)
          dlq/
            dlq-block.fn.ts (12 lines)
            dlq-review.fn.ts (13 lines)
            dlq-safe.fn.ts (13 lines)
          gateway/
            command-gateway.fn.ts (20 lines)
            webhook.fn.ts (3 lines)
          ier/
            background.lane.fn.ts (3 lines)
            critical.lane.fn.ts (3 lines)
            ier.fn.ts (7 lines)
            standard.lane.fn.ts (3 lines)
          observability/
            domain-errors.fn.ts (22 lines)
            domain-metrics.fn.ts (20 lines)
          projection/
            critical-proj.fn.ts (8 lines)
            event-funnel.fn.ts (24 lines)
            standard-proj.fn.ts (8 lines)
          relay/
            outbox-relay.fn.ts (21 lines)
          index.ts (2 lines)
          staleness-contract.ts (0 lines)
          types.ts (15 lines)
        .eslintrc.js (0 lines)
        .gitignore (10 lines)
        package.json (31 lines)
        tsconfig.dev.json (5 lines)
        tsconfig.json (18 lines)
      .firebaserc (5 lines)
      firebase.json (46 lines)
    frontend-firebase/
      firestore/
        firestore.indexes.json (43 lines)
        firestore.rules (9 lines)
      storage/
        storage.rules (12 lines)
  shared-kernel/
    constants/
      location-units.ts (21 lines)
      roles.ts (28 lines)
      routes.ts (0 lines)
      settings.ts (0 lines)
      skills.ts (59 lines)
      status.ts (46 lines)
      taiwan-address.ts (18 lines)
    data-contracts/
      account/
        account-contract.ts (74 lines)
        skill-grant-contract.ts (18 lines)
      authority-snapshot/
        index.ts (13 lines)
      command-result-contract/
        index.ts (22 lines)
      event-envelope/
        index.ts (15 lines)
      scheduling/
        schedule-contract.ts (33 lines)
        workspace-schedule-proposed.contract.ts (17 lines)
      semantic/
        semantic-contracts.ts (47 lines)
      skill-tier/
        index.ts (63 lines)
      tag-authority/
        index.ts (62 lines)
    infra-contracts/
      outbox-contract/
        index.ts (18 lines)
      read-consistency/
        index.ts (10 lines)
      resilience-contract/
        index.ts (22 lines)
      staleness-contract/
        index.ts (6 lines)
      token-refresh-contract/
        index.ts (19 lines)
      version-guard/
        index.ts (10 lines)
    ports/
      i-auth.service.ts (25 lines)
      i-file-store.ts (12 lines)
      i-firestore.repo.ts (37 lines)
      i-messaging.ts (26 lines)
      index.ts (0 lines)
    index.ts (0 lines)
package.json (135 lines)
tsconfig.json (34 lines)
```