var module = angular.mock.module;
var uiRouter = require("angular-ui-router");

function animateFlush($animate) {
  $animate && $animate.triggerCallbacks && $animate.triggerCallbacks(); // 1.2-1.3
  $animate && $animate.flush && $animate.flush(); // 1.4
}

function animateFlush($animate) {
  $animate && $animate.triggerCallbacks && $animate.triggerCallbacks(); // 1.2-1.3
  $animate && $animate.flush && $animate.flush(); // 1.4
}

describe('uiView', function () {
  'use strict';

  var log, scope, $compile, elem;

  beforeEach(function() {
    var depends = ['ui.router', 'ui.router.state.events'];

    try {
      angular.module('ngAnimate');
      depends.push('ngAnimate', 'ngAnimateMock');
    } catch(e) {
      angular.module('mock.animate', []).value('$animate', null);
      module('mock.animate');
    }

    angular.module('ui.router.test', depends);
    module('ui.router.test');
  });

  beforeEach(module(function ($provide, $stateEventsProvider) {
    $stateEventsProvider.enable();
    $provide.decorator('$uiViewScroll', function () {
      return jasmine.createSpy('$uiViewScroll');
    });
  }));

  beforeEach(function() {
    log = '';
  });

  var aState = {
    template: 'aState template'
  },
  bState = {
    template: 'bState template'
  },
  cState = {
    views: {
      'cview': {
        template: 'cState cview template'
      }
    }
  },
  dState = {
    views: {
      'dview1': {
        template: 'dState dview1 template'
      },
      'dview2': {
        template: 'dState dview2 template'
      }
    }
  },
  eState = {
    template: '<div ui-view="eview" class="eview"></div>'
  },
  fState = {
    views: {
      'eview': {
        template: 'fState eview template'
      }
    }
  },
  gState = {
    template: '<div ui-view="inner"><span>{{content}}</span></div>'
  },
  hState = {
    views: {
      'inner': {
        template: 'hState inner template'
      }
    }
  },
  iState = {
    template: '<div ui-view>'+
        '<ul><li ng-repeat="item in items">{{item}}</li></ul>'+
      '</div>'
  },
  jState = {
    template: 'jState'
  },
  kState = {
    controller: function() {
      this.someProperty = "value"
    },
    template: "hi",
    controllerAs: "vm"
  },
  lState = {
    views: {
      view1: {
        template: 'view1'
      },
      view2: {
        template: 'view2'
      },
      view3: {
        template: 'view3'
      }
    }
  },

  oState = {
    template: 'oState',
    controller: function ($scope, $element) {
      $scope.elementId = $element.attr('id');
    }
  };

  beforeEach(module(function ($stateProvider) {
    $stateProvider
      .state('a', aState)
      .state('b', bState)
      .state('c', cState)
      .state('d', dState)
      .state('e', eState)
      .state('e.f', fState)
      .state('g', gState)
      .state('g.h', hState)
      .state('i', iState)
      .state('j', jState)
      .state('k', kState)
      .state('l', lState)
      .state('m', {
        template: 'mState',
        controller: function($scope) {
          log += 'ctrl(m);';
          $scope.$on('$destroy', function() { log += '$destroy(m);'; });
        }
      })
      .state('n', {
        template: 'nState',
        controller: function($scope) { log += 'ctrl(n);'; }
      })
      .state('o', oState)
  }));

  beforeEach(inject(function ($rootScope, _$compile_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    elem = angular.element('<div>');
  }));

  describe('linking ui-directive', function () {

    it('anonymous ui-view should be replaced with the template of the current $state', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      expect(elem.find('ui-view').text()).toBe('');

      $state.transitionTo(aState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(aState.template);
    }));

    it('named ui-view should be replaced with the template of the current $state', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view name="cview"></ui-view></div>')(scope));

      $state.transitionTo(cState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(cState.views.cview.template);
    }));

    it('ui-view should be updated after transition to another state', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));
      expect(elem.find('ui-view').text()).toBe('');

      $state.transitionTo(aState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(aState.template);

      $state.transitionTo(bState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(bState.template);
    }));

    it('should handle NOT nested ui-views', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view name="dview1" class="dview1"></ui-view><ui-view name="dview2" class="dview2"></ui-view></div>')(scope));
      expect(elem.find('ui-view').eq(0).text()).toBe('');
      expect(elem.find('ui-view').eq(1).text()).toBe('');

      $state.transitionTo(dState);
      $q.flush();

      expect(elem.find('ui-view').eq(0).text()).toBe(dState.views.dview1.template);
      expect(elem.find('ui-view').eq(1).text()).toBe(dState.views.dview2.template);
    }));

    it('should handle nested ui-views (testing two levels deep)', inject(function ($state, $q) {
      $compile(elem.append('<div><ui-view></ui-view></div>'))(scope);
      expect(elem.find('ui-view').text()).toBe('');

      $state.transitionTo(fState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(fState.views.eview.template);
    }));
  });

  describe('handling initial view', function () {
    it('initial view should be compiled if the view is empty', inject(function ($state, $q) {
      var content = 'inner content';
      scope.content = content;
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      $state.transitionTo(gState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(content);
    }));

    it('initial view should be put back after removal of the view', inject(function ($state, $q) {
      var content = 'inner content';
      scope.content = content;
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      $state.go(hState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(hState.views.inner.template);

      // going to the parent state which makes the inner view empty
      $state.go(gState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(content);
    }));

    // related to issue #435
    it('initial view should be transcluded once to prevent breaking other directives', inject(function ($state, $q) {
      scope.items = ["I", "am", "a", "list", "of", "items"];

      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      // transition to state that has an initial view
      $state.transitionTo(iState);
      $q.flush();

      // verify if ng-repeat has been compiled
      expect(elem.find('li').length).toBe(scope.items.length);

      // transition to another state that replace the initial content
      $state.transitionTo(jState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(jState.template);

      // transition back to the state with empty subview and the initial view
      $state.transitionTo(iState);
      $q.flush();

      // verify if the initial view is correct
      expect(elem.find('li').length).toBe(scope.items.length);

      // change scope properties
      scope.$apply(function () {
        scope.items.push(".", "Working?");
      });

      // verify if the initial view has been updated
      expect(elem.find('li').length).toBe(scope.items.length);
    }));
  });

  describe('autoscroll attribute', function () {
    it('should NOT autoscroll when unspecified', inject(function ($state, $q, $uiViewScroll, $animate) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      animateFlush($animate);

      expect($uiViewScroll).not.toHaveBeenCalled();
    }));

    it('should autoscroll when expression is missing', inject(function ($state, $q, $uiViewScroll, $animate) {
      elem.append($compile('<div><ui-view autoscroll></ui-view></div>')(scope));
      $state.transitionTo(aState);
      $q.flush();

      animateFlush($animate);

      expect($uiViewScroll).toHaveBeenCalledWith(elem.find('span').parent());
    }));

    it('should autoscroll based on expression', inject(function ($state, $q, $uiViewScroll, $animate) {
      scope.doScroll = false;

      elem.append($compile('<div><ui-view autoscroll="doScroll"></ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      animateFlush($animate);

      expect($uiViewScroll).not.toHaveBeenCalled();

      scope.doScroll = true;
      $state.transitionTo(bState);
      $q.flush();

      animateFlush($animate);

      var target,
          index   = -1,
          uiViews = elem.find('ui-view');

      while (index++ < uiViews.length) {
        var uiView = angular.element(uiViews[index]);
        if (uiView.text() === bState.template) target = uiView;
      }

      expect($uiViewScroll).toHaveBeenCalledWith(target);
    }));
  });

  it('should instantiate a controller with controllerAs', inject(function($state, $q) {
    elem.append($compile('<div><ui-view>{{vm.someProperty}}</ui-view></div>')(scope));
    $state.transitionTo(kState);
    $q.flush();

    expect(elem.text()).toBe('value');
  }));

  it('should instantiate a controller with both $scope and $element injections', inject(function ($state, $q) {
    elem.append($compile('<div><ui-view id="oState">{{elementId}}</ui-view></div>')(scope));
    $state.transitionTo(oState);
    $q.flush();

    expect(elem.text()).toBe('oState');
  }));

  describe('play nicely with other directives', function() {
    // related to issue #857
    it('should work with ngIf', inject(function ($state, $q, $compile) {
      // ngIf does not exist in 1.0.8
      if (angular.version.full === '1.0.8') return;

      scope.someBoolean = false;
      elem.append($compile('<div ng-if="someBoolean"><ui-view></ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      // Verify there is no ui-view in the DOM
      expect(elem.find('ui-view').length).toBe(0);

      // Turn on the div that holds the ui-view
      scope.someBoolean = true;
      scope.$digest();

      // Verify that the ui-view is there and it has the correct content
      expect(elem.find('ui-view').text()).toBe(aState.template);

      // Turn off the ui-view
      scope.someBoolean = false;
      scope.$digest();

      // Verify there is no ui-view in the DOM
      expect(elem.find('ui-view').length).toBe(0);

      // Turn on the div that holds the ui-view once again
      scope.someBoolean = true;
      scope.$digest();

      // Verify that the ui-view is there and it has the correct content
      expect(elem.find('ui-view').text()).toBe(aState.template);
    }));

    it ('should work with ngClass', inject(function($state, $q, $compile) {
      scope.showClass = false;
      elem.append($compile('<div><ui-view ng-class="{\'someClass\': showClass}"></ui-view></div>')(scope));

      expect(elem.find('ui-view')).not.toHaveClass('someClass');

      scope.showClass = true;
      scope.$digest();

      expect(elem.find('ui-view')).toHaveClass('someClass');

      scope.showClass = false;
      scope.$digest();

      expect(elem.find('ui-view')).not.toHaveClass('someClass');
    }));

    describe ('working with ngRepeat', function() {
      // ngRepeat does not work properly with uiView in 1.0.8 & 1.1.5
      if (['1.0.8', '1.1.5'].indexOf(angular.version.full) !== -1) return;

      it ('should have correct number of uiViews', inject(function($state, $q, $compile) {
        elem.append($compile('<div><ui-view ng-repeat="view in views" name="{{view}}"></ui-view></div>')(scope));

        // Should be no ui-views in DOM
        expect(elem.find('ui-view').length).toBe(0);

        // Lets add 3
        scope.views = ['view1', 'view2', 'view3'];
        scope.$digest();

        // Should be 3 ui-views in the DOM
        expect(elem.find('ui-view').length).toBe(scope.views.length);

        // Lets add one more - yay two-way binding
        scope.views.push('view4');
        scope.$digest();

        // Should have 4 ui-views
        expect(elem.find('ui-view').length).toBe(scope.views.length);

        // Lets remove 2 ui-views from the DOM
        scope.views.pop();
        scope.views.pop();
        scope.$digest();

        // Should have 2 ui-views
        expect(elem.find('ui-view').length).toBe(scope.views.length);
      }));

      it ('should populate each view with content', inject(function($state, $q, $compile) {
        elem.append($compile('<div><ui-view ng-repeat="view in views" name="{{view}}">defaultcontent</ui-view></div>')(scope));

        $state.transitionTo(lState);
        $q.flush();

        expect(elem.find('ui-view').length).toBe(0);

        scope.views = ['view1', 'view2'];

        scope.$digest();

        var uiViews = elem.find('ui-view');

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).length).toBe(0);

        scope.views.push('view3');
        scope.$digest();

        uiViews = elem.find('ui-view');

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).text()).toBe(lState.views.view3.template);
      }));

      it ('should interpolate ui-view names', inject(function($state, $q, $compile) {
        elem.append($compile('<div ng-repeat="view in views">' +
          '<ui-view name="view{{$index + 1}}">hallo</ui-view>' +
          '</div>')(scope));

        $state.transitionTo(lState);
        $q.flush();

        expect(elem.find('ui-view').length).toBe(0);

        scope.views = ['view1', 'view2'];

        scope.$digest();

        var uiViews = elem.find('ui-view');

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).length).toBe(0);

        scope.views.push('view3');
        scope.$digest();

        uiViews = elem.find('ui-view');

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).text()).toBe(lState.views.view3.template);
      }));
    });
  });

  describe('AngularJS Animations', function() {
    it ('should do transition animations', inject(function($state, $q, $compile, $animate) {
      var content = 'Initial Content',
          animation;
      elem.append($compile('<div><ui-view>' + content + '</ui-view></div>')(scope));

      // Enter Animation
      animation = $animate.queue.shift();
      expect(animation.event).toBe('enter');
      expect(animation.element.text() + "-1").toBe(content + "-1");

      $state.transitionTo(aState);
      $q.flush();

      // Enter Animation
      animation = $animate.queue.shift();
      expect(animation.event).toBe('enter');
      expect(animation.element.text() + "-2").toBe(aState.template + "-2");
      // Leave Animation
      animation = $animate.queue.shift();
      expect(animation.event).toBe('leave');
      expect(animation.element.text() + "-3").toBe(content + "-3");

      $state.transitionTo(bState);
      $q.flush();

      // Enter Animation
      animation = $animate.queue.shift();
      expect(animation.event).toBe('enter');
      expect(animation.element.text() + "-4").toBe(bState.template + "-4");
      // Leave Animation
      animation = $animate.queue.shift();
      expect(animation.event).toBe('leave');
      expect(animation.element.text() + "-5").toBe(aState.template + "-5");

      // No more animations
      expect($animate.queue.length).toBe(0);
    }));

    it ('should do ngClass animations', inject(function($state, $q, $compile, $animate) {
      scope.classOn = false;
      var content = 'Initial Content',
          className = 'yay',
          animation;
      elem.append($compile('<div><ui-view ng-class="{\'' + className + '\': classOn}">' + content + '</ui-view></div>')(scope));
      // Don't care about enter class
      $animate.queue.shift();

      scope.classOn = true;
      scope.$digest();

      animation = $animate.queue.shift();
      expect(animation.event).toBe('addClass');
      expect(animation.element.text()).toBe(content);

      scope.classOn = false;
      scope.$digest();

      animation = $animate.queue.shift();
      expect(animation.event).toBe('removeClass');
      expect(animation.element.text()).toBe(content);

      // No more animations
      expect($animate.queue.length).toBe(0);
    }));

    it ('should do ngIf animations', inject(function($state, $q, $compile, $animate) {
      scope.shouldShow = false;
      var content = 'Initial Content',
          animation;
      elem.append($compile('<div><ui-view ng-if="shouldShow">' + content + '</ui-view></div>')(scope));

      // No animations yet
      expect($animate.queue.length).toBe(0);

      scope.shouldShow = true;
      scope.$digest();

      // $ViewDirective enter animation - Basically it's just the <!-- uiView --> comment
      animation = $animate.queue.shift();
      expect(animation.event).toBe('enter');
      expect(animation.element.text()).toBe('');

      // $ViewDirectiveFill enter animation - The second uiView directive that files in the content
      animation = $animate.queue.shift();
      expect(animation.event).toBe('enter');
      expect(animation.element.text()).toBe(content);

      scope.shouldShow = false;
      scope.$digest();

      // uiView leave animation
      animation = $animate.queue.shift();
      expect(animation.event).toBe('leave');
      expect(animation.element.text()).toBe(content);

      // No more animations
      expect($animate.queue.length).toBe(0);
    }));

    it ('should disable animations if noanimation="true" is present', inject(function($state, $q, $compile, $animate) {
      var content = 'Initial Content', animation;
      elem.append($compile('<div><ui-view noanimation="true">' + content + '</ui-view></div>')(scope));

      animation = $animate.queue.shift();
      expect(animation).toBeUndefined();

      $state.transitionTo(aState);
      $q.flush();
      animation = $animate.queue.shift();
      expect(animation).toBeUndefined();
      expect(elem.text()).toBe(aState.template);

      $state.transitionTo(bState);
      $q.flush();
      animation = $animate.queue.shift();
      expect(animation).toBeUndefined();
      expect(elem.text()).toBe(bState.template);
    }));

    describe('$destroy event', function() {
      it('is triggered after animation ends', inject(function($state, $q, $animate, $rootScope) {
        elem.append($compile('<div><ui-view></ui-view></div>')(scope));

        $state.transitionTo('m');
        $q.flush();
        expect(log).toBe('ctrl(m);');
        $state.transitionTo('n');
        $q.flush();

        expect(log).toBe('ctrl(m);ctrl(n);');
        animateFlush($animate);
        expect(log).toBe('ctrl(m);ctrl(n);$destroy(m);');
      }));

      it('is triggered before $stateChangeSuccess if noanimation is present', inject(function($state, $q, $animate, $rootScope) {
        elem.append($compile('<div><ui-view noanimation="true"></ui-view></div>')(scope));

        $state.transitionTo('m');
        $q.flush();
        expect(log).toBe('ctrl(m);');
        $state.transitionTo('n');
        $q.flush();
        expect(log).toBe('ctrl(m);$destroy(m);ctrl(n);');
      }));
    });
  });
});

describe('uiView controllers or onEnter handlers', function() {
  var el, template, scope, document, count;

  beforeEach(module('ui.router'));

  beforeEach(module(function($stateProvider) {
    count = 0;
    $stateProvider
      .state('aside',         { url: '/aside', template: '<div class="aside"></div>' })
      .state('A',           { url: '/A', template: '<div class="A" ui-view="fwd"></div>' })
      .state('A.fwd', {
        url: '/fwd', views: { 'fwd': {
          template: '<div class="fwd" ui-view>',
          controller: function($state) { if (count++ < 20 && $state.current.name == 'A.fwd') $state.go(".nest"); }
        }}
      })
      .state('A.fwd.nest',  { url: '/nest', template: '<div class="nest"></div>' });
  }));

  beforeEach(inject(function($document) {
    document = $document[0];
  }));

  it('should not go into an infinite loop when controller uses $state.go', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><ui-view></ui-view></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    $state.transitionTo('aside');
    $q.flush();
    expect(template[0].querySelector('.aside')).toBeDefined();
    expect(template[0].querySelector('.fwd')).toBeNull();

    $state.transitionTo('A');
    $q.flush();
    expect(template[0].querySelector('.A')).not.toBeNull();
    expect(template[0].querySelector('.fwd')).toBeNull();

    $state.transitionTo('A.fwd');
    $q.flush();
    expect(template[0].querySelector('.A')).not.toBeNull();
    expect(template[0].querySelector('.fwd')).not.toBeNull();
    expect(template[0].querySelector('.nest')).not.toBeNull();
    expect(count).toBe(1);
  }));
});
