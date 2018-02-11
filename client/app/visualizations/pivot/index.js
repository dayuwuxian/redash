import angular from 'angular';
import $ from 'jquery';
import moment from 'moment';
import 'pivottable';
import 'pivottable/dist/pivot.css';
import './style.scss';
import editorTemplate from './pivottable-editor.html';
import formatValue from '../format-value';

function sortMoment(a, b) {
  return a - b;
}

class MomentWrapper extends moment {
  constructor(value, clientConfig, type) {
    super(value);
    this._type = type;
    this._clientConfig = clientConfig;
    this.toString = () => formatValue(null, this._clientConfig, this, type);
  }
}

function buildData(queryResult, clientConfig) {
  const sorters = {};
  const data = angular.copy(queryResult.getData());
  const columnTypes = queryResult.getColumns().reduce((types, col) => {
    types[col.name] = col.type;
    return types;
  }, {});
  data.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (value && moment.isMoment(value)) {
        sorters[key] = sortMoment;
        item[key] = new MomentWrapper(value, clientConfig, columnTypes[key]);
      }
    });
  });
  return {
    data,
    sorters,
  };
}

function pivotTableRenderer(clientConfig) {
  return {
    restrict: 'E',
    scope: {
      queryResult: '=',
      visualization: '=',
    },
    template: '',
    replace: false,
    link($scope, element) {
      function removeControls() {
        const hideControls =
          $scope.visualization.options.controls &&
          $scope.visualization.options.controls.enabled;

        document.querySelectorAll('.pvtAxisContainer, .pvtRenderer, .pvtVals').forEach((control) => {
          if (hideControls) {
            control.style.display = 'none';
          } else {
            control.style.display = '';
          }
        });
      }

      function updatePivot() {
        $scope.$watch('queryResult && queryResult.getData()', (data) => {
          if (!data) {
            return;
          }

          if ($scope.queryResult.getData() !== null) {
            // We need to give the pivot table its own copy of the data, because it changes
            // it which interferes with other visualizations.
            const { data, sorters } = buildData($scope.queryResult, clientConfig);
            const options = {
              renderers: $.pivotUtilities.renderers,
              sorters: attr => sorters[attr],
              onRefresh(config) {
                const configCopy = Object.assign({}, config);
                // delete some values which are functions
                delete configCopy.aggregators;
                delete configCopy.renderers;
                delete configCopy.onRefresh;
                // delete some bulky default values
                delete configCopy.rendererOptions;
                delete configCopy.localeStrings;

                if ($scope.visualization) {
                  $scope.visualization.options = configCopy;
                }
              },
            };

            if ($scope.visualization) {
              Object.assign(options, $scope.visualization.options);
            }

            $(element).pivotUI(data, options, true);
            removeControls();
          }
        });
      }

      $scope.$watch('queryResult && queryResult.getData()', updatePivot);
      $scope.$watch('visualization.options.controls.enabled', removeControls);
    },
  };
}

function pivotTableEditor() {
  return {
    restrict: 'E',
    template: editorTemplate,
  };
}

export default function init(ngModule) {
  ngModule.directive('pivotTableRenderer', pivotTableRenderer);
  ngModule.directive('pivotTableEditor', pivotTableEditor);

  ngModule.config((VisualizationProvider) => {
    const editTemplate = '<pivot-table-editor></pivot-table-editor>';
    const defaultOptions = {
      defaultRows: 10,
      defaultColumns: 3,
      minColumns: 2,
    };

    VisualizationProvider.registerVisualization({
      type: 'PIVOT',
      name: 'Pivot Table',
      renderTemplate: '<pivot-table-renderer visualization="visualization" query-result="queryResult"></pivot-table-renderer>',
      editorTemplate: editTemplate,
      defaultOptions,
    });
  });
}
