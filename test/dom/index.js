/** @jsx dom */

import trigger from 'trigger-event';
import Emitter from 'component-emitter';
import raf from 'component-raf';
import assert from 'assert';
import {component,deku,dom,render} from '../../';
import {HelloWorld,Span,TwoWords,mount,div} from '../helpers';

it('should render and remove an element', function(){
  var app = deku();
  app.mount(<span>Hello World</span>);
  var el = div();
  var renderer = render(app, el, { batching: false });
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  renderer.remove();
  assert.equal(el.innerHTML, '');
})

it('should replace a mounted element', function(){
  var app = deku();
  app.mount(<span>Hello World</span>);
  var el = div();
  var renderer = render(app, el, { batching: false });
  app.mount(<div>Foo!</div>);
  assert.equal(el.innerHTML, '<div>Foo!</div>');
  renderer.remove();
  assert.equal(el.innerHTML, '');
})

it('should remove the mounted element when unmounted', function(){
  var app = deku();
  app.mount(<span>Hello World</span>);
  var el = div();
  var renderer = render(app, el, { batching: false });
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  app.unmount();
  assert.equal(el.innerHTML, '');
  app.mount(<div>Hello World</div>);
  assert.equal(el.innerHTML, '<div>Hello World</div>');
  renderer.remove();
  assert.equal(el.innerHTML, '');
})

it('should render and remove a component', function(){
  var Test = {
    render: function(){
      return dom('span', null, 'Hello World');
    }
  };
  var app = deku();
  app.mount(
    dom(Test)
  );
  var el = div();
  var renderer = render(app, el, { batching: false });
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  renderer.remove();
  assert.equal(el.innerHTML, '');
})

it('should have initial state', function(){
  var DefaultState = {
    initialState: function(){
      return {
        text: 'Hello World'
      };
    },
    render: function(props, state){
      return dom('span', null, state.text);
    }
  };
  var app = deku();
  app.mount(dom(DefaultState));
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span>Hello World</span>')
  })
})

it('should create a component with properties', function(){
  var Test = {
    render(props) {
      return dom('span', null, [props.text])
    }
  }
  var app = deku()
  app.mount(dom(Test, { text: 'Hello World' }))
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span>Hello World</span>')
  })
})

it('should compose components', function(){
  var Composed = {
    render: function(props, state){
      return dom(HelloWorld);
    }
  };
  var app = deku();
  app.mount(dom(Composed));
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span>Hello World</span>');
  })
});

it('should render a component using jsx', function(){
  var Test = {
    render: function(){
      return <span class="yup">Hello World</span>
    }
  };
  var app = deku()
  app.mount(<Test />)
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span class="yup">Hello World</span>');
  })
})

it('should compose components and pass in props', function(){
  var Composed = {
    render: function(props, state){
      return dom(TwoWords, { one: 'Hello', two: 'World' });
    }
  };
  var app = deku()
  app.mount(<Composed />)
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span>Hello World</span>');
  })
});

it('should update sub-components', function(){
  var Composed = {
    render: function(props, state){
      return (
        <div>
          <TwoWords one="Hello" two={props.app} />
        </div>
      );
    }
  };
  var app = deku()
  app.mount(<Composed app="Pluto" />)
  mount(app, function(el){
    assert.equal(el.innerHTML, '<div><span>Hello Pluto</span></div>')
  })
});

it('should update on the next frame', function(done){
  var Composed = {
    render: function(props, state){
      return (
        <div>
          <TwoWords one="Hello" two={props.planet} />
        </div>
      );
    }
  };
  var app = deku()
  app.mount(<Composed planet="Pluto" />)
  var el = div()
  var renderer = render(app, el)
  app.mount(<Composed planet="Saturn" />)
  assert.equal(el.innerHTML, '<div><span>Hello Pluto</span></div>')
  requestAnimationFrame(function(){
    assert.equal(el.innerHTML, '<div><span>Hello Saturn</span></div>')
    renderer.remove();
    done()
  })
});

it('should allow components to have child nodes', function(){
  var ComponentA = {
    render: function(props, state){
      return dom('div', null, props.children);
    }
  };
  var ComponentB = {
    render: function(props, state){
      return dom(ComponentA, null, [
        dom('span', null, 'Hello World!')
      ]);
    }
  };
  var app = deku()
  app.mount(dom(ComponentB));
  mount(app, function(el){
    assert.equal(el.innerHTML, '<div><span>Hello World!</span></div>');
  })
});

it('should update component child nodes', function(){
  var ComponentA = {
    render: function(props, state){
      return dom('div', null, props.children);
    }
  };
  var ComponentB = {
    render: function(props, state){
      return dom(ComponentA, null, [
        dom('span', null, props.text)
      ]);
    }
  };
  var app = deku()
  app.mount(dom(ComponentB, { text: 'Hello world!' }));
  mount(app, function(el){
    app.mount(dom(ComponentB, { text: 'Hello Pluto!' }));
    assert.equal(el.innerHTML, '<div><span>Hello Pluto!</span></div>');
  })
});

it('should allow components to have other components as child nodes', function(){
  var ComponentA = {
    render: function(props, state){
      return dom('div', { name: 'ComponentA' }, props.children);
    }
  };
  var ComponentC = {
    render: function(props, state){
      return dom('div', { name: 'ComponentC' }, props.children);
    }
  };
  var ComponentB = {
    render: function(props, state){
      return dom('div', { name: 'ComponentB' }, [
        dom(ComponentA, null, [
          dom(ComponentC, { text: props.text }, [
            dom('span', null, 'Hello Pluto!')
          ])
        ])
      ]);
    }
  };
  var app = deku()
  app.mount(dom(ComponentB, { text: 'Hello World!' }))
  mount(app, function(el){
    assert.equal(el.innerHTML, '<div name="ComponentB"><div name="ComponentA"><div name="ComponentC"><span>Hello Pluto!</span></div></div></div>')
  })
});

it('should only update ONCE when props/state is changed in different parts of the tree', function(done){
  var i;
  var emitter = new Emitter();

  var ComponentA = {
    initialState: function(){
      return {
        text: 'Deku Shield'
      };
    },
    afterMount: function(el, props, state, send) {
      var self = this;
      emitter.on('data', function(text){
        send({ text: text });
      })
    },
    render: function(props, state){
      i++;
      return dom('div', null, [props.text, ' ', state.text]);
    }
  };

  var ComponentB = {
    render: function(props, state){
      i++;
      return dom('div', null, [
        dom(ComponentA, { text: props.text })
      ]);
    }
  };

  var app = deku();
  app.mount(dom(ComponentB, { text: '2x' }))

  var el = div();
  var renderer = render(app, el)

  i = 0;

  // Mark ComponentA as dirty from a state change
  emitter.emit('data', 'Mirror Shield');

  // Update the top-level props
  app.mount(dom(ComponentB, { text: '3x' }))

  requestAnimationFrame(function(){
    assert.equal(i, 2)
    assert.equal(el.innerHTML, "<div><div>3x Mirror Shield</div></div>")
    renderer.remove();
    done();
  });
});

it('should only update if shouldUpdate returns true', function(){
  var i = 0;
  var Component = {
    afterUpdate(){
      i = i + 1;
    },
    shouldUpdate(){
      return false;
    },
    render(){
      return dom('div')
    }
  };
  var app = deku()
  app.mount(<Component foo="bar" />)
  assert.equal(i, 0);
  mount(app, function(el){
    app.mount(<Component foo="baz" />)
    assert.equal(i, 0)
  })
});

it('should not allow setting the state during render', function (done) {
  var Impure = {
    render: function(props, state, setState){
      assert(!setState);
      done();
      return dom();
    }
  };
  var app = deku()
  app.mount(<Impure />)
  mount(app)
});
