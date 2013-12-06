/*global define*/
define([
        '../../Core/defined',
        '../../Core/defineProperties',
        '../../Core/DeveloperError',
        '../../Core/BoundingRectangle',
        '../../Scene/PerformanceDisplay',
        '../../Scene/DebugModelMatrixPrimitive',
        '../../Scene/TileCoordinatesImageryProvider',
        '../../Core/Color',
        '../createCommand',
        '../../ThirdParty/knockout'
    ], function(
        defined,
        defineProperties,
        DeveloperError,
        BoundingRectangle,
        PerformanceDisplay,
        DebugModelMatrixPrimitive,
        TileCoordinatesImageryProvider,
        Color,
        createCommand,
        knockout) {
    "use strict";

    function frustumStatsToString(stats) {
        var str;
        if (defined(stats)) {
            str = 'Total commands: ' + stats.totalCommands + '<br>Commands in frustums:';
            var com = stats.commandsInFrustums;
            for (var n in com) {
                if (com.hasOwnProperty(n)) {
                    str += '<br>&nbsp;&nbsp;&nbsp;&nbsp;' + n + ': ' + com[n];
                }
            }
        }

        return str;
    }

    var br = new BoundingRectangle(220, 5, 100, 75);
    var bc = new Color(0.15, 0.15, 0.15, 0.75);

    /**
     * The view model for {@link CesiumInspector}.
     * @alias CesiumInspectorViewModel
     * @constructor
     *
     * @param {Scene} scene The scene instance to use.
     *
     * @exception {DeveloperError} scene is required.
     */
    var CesiumInspectorViewModel = function(scene) {
        if (!defined(scene)) {
            throw new DeveloperError('scene is required');
        }

        var that = this;

        this._scene = scene;
        this._canvas = scene.getCanvas();
        this._primitive = undefined;
        this._tile = undefined;
        this._modelMatrixPrimitive = undefined;
        this._performanceDisplay = undefined;

        /**
         * Gets or sets the show frustums state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.frustums = false;

        /**
         * Gets or sets the show performance display state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.performance = false;

        /**
         * Gets or sets the show primitive bounding sphere state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.primitiveBoundingSphere = false;

        /**
         * Gets or sets the show primitive reference frame state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.primitiveRefFrame = false;

        /**
         * Gets or sets the filter primitive state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.filterPrimitive = false;

        /**
         * Gets or sets the show tile bounding sphere state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.tileBoundingSphere = false;

        /**
         * Gets or sets the filter tile state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.filterTile = false;

        /**
         * Gets or sets the show wireframe state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.wireframe = false;

        /**
         * Gets or sets the suspend updates state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.suspendUpdates = false;

        /**
         * Gets or sets the show tile coordinates state.  This property is observable.
         *
         * @type {Boolean}
         */
        this.tileCoords = false;

        /**
         * Gets or sets the frustum statistic text.  This property is observable.
         *
         * @type {String}
         */
        this.frustumStatText = '';

        /**
         * Gets or sets the selected tile information text.  This property is observable.
         *
         * @type {String}
         */
        this.tileText = '';

        /**
         * Gets if a primitive has been selected.  This property is observable.
         *
         * @type {Boolean}
         */
        this.hasPickedPrimitive = false;

        /**
         * Gets if a tile has been selected.  This property is observable.
         *
         * @type {Boolean}
         */
        this.hasPickedTile = false;

        /**
         * Gets if the picking primitive command is active.  This property is observable.
         *
         * @type {Boolean}
         */
        this.pickPimitiveActive = false;

        /**
         * Gets if the picking tile command is active.  This property is observable.
         *
         * @type {Boolean}
         */
        this.pickTleActive = false;

        /**
         * Gets or sets if the cesium inspector drop down is visible.  This property is observable.
         *
         * @type {Boolean}
         */
        this.dropDownVisible = true;

        /**
         * Gets or sets if the general section is visible.  This property is observable.
         *
         * @type {Boolean}
         */
        this.generalVisible = true;

        /**
         * Gets or sets if the primitive section is visible.  This property is observable.
         *
         * @type {Boolean}
         */
        this.primitivesVisible = false;

        /**
         * Gets or sets if the terrain section is visible.  This property is observable.
         *
         * @type {Boolean}
         */
        this.terrainVisible = false;

        /**
         * Gets or sets if the text on the general section expand button.  This property is observable.
         *
         * @type {String}
         */
        this.generalSwitchText = '-';

        /**
         * Gets or sets if the text on the primitive section expand button.  This property is observable.
         *
         * @type {String}
         */
        this.primitivesSwitchText = '+';

        /**
         * Gets or sets if the text on the terrain section expand button.  This property is observable.
         *
         * @type {String}
         */
        this.terrainSwitchText = '+';

        knockout.track(this, ['filterTile', 'suspendUpdates', 'dropDownVisible', 'frustums',
                              'frustumStatText', 'pickTileActive', 'pickPrimitiveActive', 'hasPickedPrimitive',
                              'hasPickedTile', 'tileText', 'generalVisible', 'generalSwitchText',
                              'primitivesVisible', 'primitivesSwitchText', 'terrainVisible', 'terrainSwitchText']);

        this._toggleDropDown = createCommand(function() {
            that.dropDownVisible = !that.dropDownVisible;
        });

        this._toggleGeneral = createCommand(function() {
            that.generalVisible = ! that.generalVisible;
            that.generalSwitchText = that.generalVisible ? '-' : '+';
        });

        this._togglePrimitives = createCommand(function() {
            that.primitivesVisible = ! that.primitivesVisible;
            that.primitivesSwitchText = that.primitivesVisible ? '-' : '+';
        });

        this._toggleTerrain = createCommand(function() {
            that.terrainVisible = ! that.terrainVisible;
            that.terrainSwitchText = that.terrainVisible ? '-' : '+';
        });

        this._showFrustums = createCommand(function() {
            if (that.frustums) {
                that._scene.debugShowFrustums = true;
                that._frustumInterval = setInterval(function() {
                    that.frustumStatText = frustumStatsToString(scene.debugFrustumStatistics);
                }, 100);
            } else {
                clearInterval(that._frustumInterval);
                that._scene.debugShowFrustums = false;
            }
            return true;
        });

        this._showPerformance = createCommand(function() {
            if (that.performance) {
                that._performanceDisplay = new PerformanceDisplay({
                    rectangle : br,
                    backgroundColor: bc,
                    font: "12px arial,sans-serif"
                });
                that._scene.getPrimitives().add(that._performanceDisplay);
            } else {
                that._scene.getPrimitives().remove(that._performanceDisplay);
            }
            return true;
        });

        this._showPrimitiveBoundingSphere = createCommand(function() {
            that._primitive.primitive.debugShowBoundingVolume = that.primitiveBoundingSphere;
            return true;
        });

        this._showPrimitiveRefFrame = createCommand(function() {
            if (that.primitiveRefFrame) {
                var modelMatrix = that._primitive.primitive.modelMatrix;
                that._modelMatrixPrimitive = new DebugModelMatrixPrimitive({modelMatrix: modelMatrix});
                that._scene.getPrimitives().add(that._modelMatrixPrimitive);
            } else if (defined(that._modelMatrixPrimitive)){
                that._scene.getPrimitives().remove(that._modelMatrixPrimitive);
                that._modelMatrixPrimitive = undefined;
            }
            return true;
        });

        this._doFilterPrimitive = createCommand(function() {
            if (that.filterPrimitive) {
                that._scene.debugCommandFilter = function(command) {
                    return command.owner === that._primitive.primitive;
                };
            } else {
                that._scene.debugCommandFilter = undefined;
            }
            return true;
        });

        var centralBody = this._scene.getPrimitives().getCentralBody();
        this._showWireframe = createCommand(function() {
            centralBody._surface._debug.wireframe = that.wireframe;
            return true;
        });

        this._doSuspendUpdates = createCommand(function() {
            centralBody._surface._debug.suspendLodUpdate = that.suspendUpdates;
            if (!that.suspendUpdates) {
                that.filterTile = false;
            }
            return true;
        });

        var tileBoundariesLayer;
        this._showTileCoords = createCommand(function() {
            if (that.tileCoords && !defined(tileBoundariesLayer)) {
                tileBoundariesLayer = centralBody.getImageryLayers().addImageryProvider(new TileCoordinatesImageryProvider({
                    tilingScheme : centralBody.terrainProvider.getTilingScheme()
                }));
            } else if (!that.tileCoords && defined(tileBoundariesLayer)) {
                centralBody.getImageryLayers().remove(tileBoundariesLayer);
                tileBoundariesLayer = undefined;
            }
            return true;
        });

        this._showTileBoundingSphere = createCommand(function() {
            if (that.tileBoundingSphere) {
                centralBody._surface._debug.boundingSphereTile = that._tile;
            } else {
                centralBody._surface._debug.boundingSphereTile = undefined;
            }
            return true;
        });

        this._doFilterTile = createCommand(function() {
            if (!that.filterTile) {
                that.suspendUpdates = false;
                that.doSuspendUpdates();
            } else {
                that.suspendUpdates = true;
                that.doSuspendUpdates();

                centralBody._surface._tilesToRenderByTextureCount = [];

                if (defined(that._tile)) {
                    var readyTextureCount = 0;
                    var tileImageryCollection = that._tile.imagery;
                    for (var i = 0, len = tileImageryCollection.length; i < len; ++i) {
                        var tileImagery = tileImageryCollection[i];
                        if (defined(tileImagery.readyImagery) && tileImagery.readyImagery.imageryLayer.alpha !== 0.0) {
                            ++readyTextureCount;
                        }
                    }

                    centralBody._surface._tilesToRenderByTextureCount[readyTextureCount] = [that._tile];
                }
            }
            return true;
        });

        var pickPrimitive = function(e) {
            var newPick = that._scene.pick({x: e.clientX, y: e.clientY});
            if (defined(newPick)) {
                that.primitive = newPick;
            }
            that._canvas.removeEventListener('mousedown', pickPrimitive, false);
            that.pickPrimitiveActive = false;
        };

        this._pickPrimitive = createCommand(function() {
            that.pickPrimitiveActive = !that.pickPrimitiveActive;
            if (that.pickPrimitiveActive) {
                that._canvas.addEventListener('mousedown', pickPrimitive, false);
            } else {
                that._canvas.removeEventListener('mousedown', pickPrimitive, false);
            }
        });

        var selectTile = function (e) {
            var selectedTile;
            var ellipsoid = centralBody.getEllipsoid();
            var cartesian = that._scene.getCamera().controller.pickEllipsoid({x: event.clientX, y: event.clientY}, ellipsoid);

            if (defined(cartesian)) {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                var tilesRendered = centralBody._surface._tilesToRenderByTextureCount;
                for (var textureCount = 0; !selectedTile && textureCount < tilesRendered.length; ++textureCount) {
                    var tilesRenderedByTextureCount = tilesRendered[textureCount];
                    if (!defined(tilesRenderedByTextureCount)) {
                        continue;
                    }

                    for (var tileIndex = 0; !selectedTile && tileIndex < tilesRenderedByTextureCount.length; ++tileIndex) {
                        var tile = tilesRenderedByTextureCount[tileIndex];
                        if (tile.extent.contains(cartographic)) {
                            selectedTile = tile;
                        }
                    }
                }
            }

            that.tile = selectedTile;

            that._canvas.removeEventListener('mousedown', selectTile, false);
            that.pickTileActive = false;
        };

        this._pickTile = createCommand(function() {
            that.pickTileActive = !that.pickTileActive;

            if (that.pickTileActive) {
                that._canvas.addEventListener('mousedown', selectTile, false);
            } else {
                that._canvas.removeEventListener('mousedown', selectTile, false);
            }
        });
    };

    defineProperties(CesiumInspectorViewModel.prototype, {
        /**
         * Gets the scene to control.
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Scene}
         */
        scene : {
            get : function() {
                return this._scene;
            }
        },

        /**
         * Gets the command to toggle the visibility of the drop down.
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        toggleDropDown : {
            get : function() {
                return this._toggleDropDown;
            }
        },

        /**
         * Gets the command to toggle {@link Scene.debugShowFrustums}
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        showFrustums : {
            get : function() {
                return this._showFrustums;
            }
        },

        /**
         * Gets the command to toggle the visibility of a {@link PerformanceDisplay}
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        showPerformance : {
            get : function() {
                return this._showPerformance;
            }
        },

        /**
         * Gets the command to toggle the visibility of a BoundingSphere for a primitive
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        showPrimitiveBoundingSphere : {
            get : function() {
                return this._showPrimitiveBoundingSphere;
            }
        },

        /**
         * Gets the command to toggle the visibility of a {@link DebugModelMatrixPrimitive} for the model matrix of a primitive
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        showPrimitiveRefFrame : {
            get : function() {
                return this._showPrimitiveRefFrame;
            }
        },

        /**
         * Gets the command to toggle a filter that renders only a selected primitive
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        doFilterPrimitive : {
            get : function() {
                return this._doFilterPrimitive;
            }
        },

        /**
         * Gets the command to toggle the view of the CentralBody as a wireframe
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        showWireframe : {
            get : function() {
                return this._showWireframe;
            }
        },

        /**
         * Gets the command to toggle whether to suspend tile updates
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        doSuspendUpdates : {
            get : function() {
                return this._doSuspendUpdates;
            }
        },

        /**
         * Gets the command to toggle the visibility of tile coordinates
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        showTileCoords : {
            get : function() {
                return this._showTileCoords;
            }
        },

        /**
         * Gets the command to toggle the visibility of a BoundingSphere for a selected tile
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        showTileBoundingSphere : {
            get : function() {
                return this._showTileBoundingSphere;
            }
        },

        /**
         * Gets the command to toggle a filter that renders only a selected tile
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        doFilterTile : {
            get : function() {
                return this._doFilterTile;
            }
        },

        /**
         * Gets the command to expand and collapse the general section
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        toggleGeneral : {
            get : function() {
                return this._toggleGeneral;
            }
        },

        /**
         * Gets the command to expand and collapse the primitives section
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        togglePrimitives : {
            get : function() {
                return this._togglePrimitives;
            }
        },

        /**
         * Gets the command to expand and collapse the terrain section
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        toggleTerrain : {
            get : function() {
                return this._toggleTerrain;
            }
        },

        /**
         * Gets the command to pick a primitive
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        pickPrimitive : {
            get : function() {
                return this._pickPrimitive;
            }
        },

        /**
         * Gets the command to pick a tile
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        pickTile : {
            get : function() {
                return this._pickTile;
            }
        },

        /**
         * Gets or sets the current selected primitive
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        primitive: {
            set : function(newPrimitive) {
                var oldPrimitive = this._primitive;
                if (newPrimitive !== oldPrimitive) {
                    this.hasPickedPrimitive = true;
                    if (defined(oldPrimitive)) {
                        oldPrimitive.primitive.debugShowBoundingVolume = false;
                    }
                    this._scene.debugCommandFilter = undefined;
                    if (defined(this._modelMatrixPrimitive)) {
                        this._scene.getPrimitives().remove(this._modelMatrixPrimitive);
                        this._modelMatrixPrimitive = undefined;
                    }
                    this._primitive = newPrimitive;
                    newPrimitive.primitive.show = false;
                    setTimeout(function(){
                        newPrimitive.primitive.show = true;
                    }, 50);
                    this.showPrimitiveBoundingSphere();
                    this.showPrimitiveRefFrame();
                    this.doFilterPrimitive();
                }
            },

            get : function() {
                return this._primitive;
            }
        },

        /**
         * Gets or sets the current selected tile
         * @memberof CesiumInspectorViewModel.prototype
         *
         * @type {Command}
         */
        tile: {
            set : function(newTile) {
                if (defined(newTile)) {
                    this.hasPickedTile = true;
                    var oldTile = this._tile;
                    if (newTile !== oldTile) {
                        this.tileText = 'L: ' + newTile.level + ' X: ' + newTile.x + ' Y: ' + newTile.y;
                        this.tileText += '<br>SW corner: ' + newTile.extent.west + ', ' + newTile.extent.south;
                        this.tileText += '<br>NE corner: ' + newTile.extent.east + ', ' + newTile.extent.north;
                    }
                    this._tile = newTile;
                    this.showTileBoundingSphere();
                    this.doFilterTile();
                } else {
                    this.hasPickedTile = false;
                    this._tile = undefined;
                }
            },

            get : function() {
                return this._tile;
            }
        }
    });

    return CesiumInspectorViewModel;
});