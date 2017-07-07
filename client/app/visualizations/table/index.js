import { _, partial } from 'underscore';
import { getColumnCleanName } from '../../services/query-result';
import template from './table.html';
import formatValue from '../format-value';

function GridRenderer(clientConfig) {
  return {
    restrict: 'E',
    scope: {
      queryResult: '=',
      itemsPerPage: '=',
    },
    template,
    replace: false,
    controller($scope, $filter) {
      $scope.gridColumns = [];
      $scope.gridRows = [];

      $scope.$watch('queryResult && queryResult.getData()', (queryResult) => {
        if (!queryResult) {
          return;
        }

        if ($scope.queryResult.getData() == null) {
          $scope.gridColumns = [];
          $scope.filters = [];
        } else {
          $scope.filters = $scope.queryResult.getFilters();

          const columns = $scope.queryResult.getColumns();
          columns.forEach((col) => {
            col.title = getColumnCleanName(col.name);
            col.formatFunction = partial(formatValue, $filter, clientConfig, _, col.type);
          });

          $scope.gridRows = $scope.queryResult.getData();
          $scope.gridColumns = columns;
        }
      });
    },
  };
}

export default function (ngModule) {
  ngModule.config((VisualizationProvider) => {
    VisualizationProvider.registerVisualization({
      type: 'TABLE',
      name: 'Table',
      renderTemplate: '<grid-renderer options="visualization.options" query-result="queryResult"></grid-renderer>',
      skipTypes: true,
    });
  });
  ngModule.directive('gridRenderer', GridRenderer);
}
