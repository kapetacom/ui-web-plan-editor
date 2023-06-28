# [0.6.0](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.5.5...v0.6.0) (2023-06-28)


### Bug Fixes

* compat export for planner ([be23900](https://github.com/kapetacom/ui-web-plan-editor/commit/be239007f49ca5ec0fe24f73a957d6816dcd7623))


### Features

* haxy resource icons ([b30b821](https://github.com/kapetacom/ui-web-plan-editor/commit/b30b821d1bafa57dbad768b0a03ea71c64503787))

## [0.5.5](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.5.4...v0.5.5) (2023-06-26)


### Bug Fixes

* Prevent duplicate connections ([#52](https://github.com/kapetacom/ui-web-plan-editor/issues/52)) ([3ec4524](https://github.com/kapetacom/ui-web-plan-editor/commit/3ec4524b8c10b938aaf6e437acefe5c97b1d71a2))

## [0.5.4](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.5.3...v0.5.4) (2023-06-26)


### Bug Fixes

* dont render actionButton empty container (fixes hover flicker) ([1962f19](https://github.com/kapetacom/ui-web-plan-editor/commit/1962f1988e811c860d5d04c6e04671e5b615736b))

## [0.5.3](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.5.2...v0.5.3) (2023-06-26)


### Bug Fixes

* removes deprecated planner code and mobx dependencies ([#51](https://github.com/kapetacom/ui-web-plan-editor/issues/51)) ([e778992](https://github.com/kapetacom/ui-web-plan-editor/commit/e7789924ebf990c6b0c692bea233ae0dc817b286))

## [0.5.2](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.5.1...v0.5.2) (2023-06-23)


### Bug Fixes

* fade transition improvement ([9ba07ba](https://github.com/kapetacom/ui-web-plan-editor/commit/9ba07ba284a83be4943165e79d2d717e41891b75))

## [0.5.1](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.5.0...v0.5.1) (2023-06-23)


### Bug Fixes

* fix resource text in safari and simplify clipping ([9e530ac](https://github.com/kapetacom/ui-web-plan-editor/commit/9e530acfb25d4b4919b5e693ccdc69a077eeb7a4))

# [0.5.0](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.4.1...v0.5.0) (2023-06-22)


### Bug Fixes

* reenable block actions on hover + focus fix ([8e325fb](https://github.com/kapetacom/ui-web-plan-editor/commit/8e325fb193b28048f0cb5f6b31d8866e2a95f219))
* set explicit block text color to avoid style bleed [KAP-670] ([46a78cf](https://github.com/kapetacom/ui-web-plan-editor/commit/46a78cf9016683f0c858243bef3538bfdee0344e))
* tweak resource action offset for resources w/o counter ([8578d21](https://github.com/kapetacom/ui-web-plan-editor/commit/8578d2198cafada10bd98a79a8e7cb2240e13c37))


### Features

* add staggered fade-in transition to actionButtons ([a8b0253](https://github.com/kapetacom/ui-web-plan-editor/commit/a8b0253cafb9acfe8d4121657e1a82fbdd6dbc81))
* change button fade to middle-out ([4b9559f](https://github.com/kapetacom/ui-web-plan-editor/commit/4b9559faec4ea901e411a7e4576936b5b88ef69d))
* fold-out animation for resource buttons [KAP-663] ([268fcb0](https://github.com/kapetacom/ui-web-plan-editor/commit/268fcb084a1116698a10205da1a8d0b6d1aee44d))

## [0.4.1](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.4.0...v0.4.1) (2023-06-21)


### Bug Fixes

* handle deleted connections still in the ordering list [KAP-704] ([4a6d3b4](https://github.com/kapetacom/ui-web-plan-editor/commit/4a6d3b40c34e7235115e6d96b0bd4da671571197))
* tweak x-offset for dragged providers [KAP-705] ([e88c98e](https://github.com/kapetacom/ui-web-plan-editor/commit/e88c98e84ebc3aef36660e71cded83dcd2bd6556))

# [0.4.0](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.3.0...v0.4.0) (2023-06-17)


### Features

* Add support for validation of Instance and InstanceProvider ([#46](https://github.com/kapetacom/ui-web-plan-editor/issues/46)) ([8e2261d](https://github.com/kapetacom/ui-web-plan-editor/commit/8e2261deca509dde657757e381db284221c3992c))

# [0.3.0](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.2.1...v0.3.0) (2023-06-08)

### Bug Fixes

-   change resource offset calculations to support variable sizes ([3b6cbec](https://github.com/kapetacom/ui-web-plan-editor/commit/3b6cbecf89521b44e68183aa94e4b3d72258ba71))
-   use new BlockLayout from ui-web-components for block shapes ([3b978a3](https://github.com/kapetacom/ui-web-plan-editor/commit/3b978a34e61a11a49feac96e4e835c832f57bf39))

### Features

-   hovered connections bubble to top ([b216d9f](https://github.com/kapetacom/ui-web-plan-editor/commit/b216d9f24fbb66d507c5c14fb4bcc2bb3d1cad18))
-   new shape width + height calculations ([194232a](https://github.com/kapetacom/ui-web-plan-editor/commit/194232a5e1be50fd78d10622758b7655f238d1b6))

## [0.2.1](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.2.0...v0.2.1) (2023-06-05)

### Bug Fixes

-   grid cell size with negative diffs ([8d43d2f](https://github.com/kapetacom/ui-web-plan-editor/commit/8d43d2faff156c8f8ba477866cf8e277316b6437))
-   handle out-of-bounds for connection pathing ([5a7b4ba](https://github.com/kapetacom/ui-web-plan-editor/commit/5a7b4baf8ba269fe72d1354835176a50fa2bc46d))

# [0.2.0](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.1.0...v0.2.0) (2023-06-02)

### Bug Fixes

-   bugfix for short path and nicer fallbacks ([dcaf5c8](https://github.com/kapetacom/ui-web-plan-editor/commit/dcaf5c88a8a5f9d36f70a74435b40f123fd735e4))
-   fallback render on missing block definition ([b00e440](https://github.com/kapetacom/ui-web-plan-editor/commit/b00e4409ed5ed5f5900ae5eea8d3c7867c87e74e))

### Features

-   rounded corners on connections using Arcs ([9a4d86d](https://github.com/kapetacom/ui-web-plan-editor/commit/9a4d86d7b883535499dc0fd3b71267463d1cfe20))

# [0.1.0](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.0.61...v0.1.0) (2023-06-02)

### Bug Fixes

-   remove dragged blocks from path matrix ([6fc5488](https://github.com/kapetacom/ui-web-plan-editor/commit/6fc54889fa66279d99bf774bcae215b0585cfffd))

### Features

-   KAP-513 new connections w/ object avoidance ([9ce2f12](https://github.com/kapetacom/ui-web-plan-editor/commit/9ce2f125cfed92de1f9609bb3042015408cffa07))

## [0.0.61](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.0.60...v0.0.61) (2023-05-25)

### Bug Fixes

-   add export of outlet provider and error handler ([6b83295](https://github.com/kapetacom/ui-web-plan-editor/commit/6b83295a042602632f68192de77c8ce4cf1850ac))

## [0.0.60](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.0.59...v0.0.60) (2023-05-24)

### Bug Fixes

-   apply white color scheme to actionButtons ([d6142aa](https://github.com/kapetacom/ui-web-plan-editor/commit/d6142aadc44f6d831c022512b1640c003f41d123))
-   block version outlet ([ec9f946](https://github.com/kapetacom/ui-web-plan-editor/commit/ec9f94655be3bbc5b459dc5bf9d8a1a81b7bb70e))
-   fix block handle display ([7f84c75](https://github.com/kapetacom/ui-web-plan-editor/commit/7f84c756829a96cef234b02457fcc6437e65cd94))
-   fix instanceName edit + warning symbol ([84d835e](https://github.com/kapetacom/ui-web-plan-editor/commit/84d835e6c662049490cb6a2a3092749742f99b72))
-   make resources white ([717df72](https://github.com/kapetacom/ui-web-plan-editor/commit/717df72353fefac26d9830af3484cb52461ad9cf))
-   sidebar drag and drop ([1c73ef8](https://github.com/kapetacom/ui-web-plan-editor/commit/1c73ef81377dae3ea6a8ec89b71b8085e9c444c0))

## [0.0.59](https://github.com/kapetacom/ui-web-plan-editor/compare/v0.0.58...v0.0.59) (2023-05-04)

### Bug Fixes

-   use resource type name for new resources [KAP-611] ([8854e75](https://github.com/kapetacom/ui-web-plan-editor/commit/8854e751e5d17e88848aa0eccc2f2c689fdd1193))
