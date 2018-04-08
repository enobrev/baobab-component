# BaobabComponent

This is being used on a couple of client-projects.  It's probably not following the "right way" in lots of ways.  For instance, using inheritance instead of an HOC seems not to be the way to do things.  That said, it works great for my uses.

The basic premise is you extend BaobabComponent with your own component.  Then set up a method called `stateQueries`, which handles two things:

1. Defines cursors you can use to update the baobab tree.
2. Allows you to modify state just before it's rendered.

One **very** important note, this library takes over React's `setState` method, which means you can't use it reliably in a BaobabComponent child.  It's evil; It's the "wrong" way, for sure;  If it bothers you, then run away.  In practice it's been fine.


## Install

```bash
    yarn add BaobabComponent
```


```bash
    npm install BaobabComponent
```

## Use

```javascript
    import React from 'react';
    import BaobabComponent from 'BaobabComponent';
    import Data from 'Data'; // Your project Baobab Tree

    BaobabComponent.setTree(Data); // This can be done once in the project

    export default class MyComponent extends BaobabComponent {
        stateQueries() {
            const {id: sSomeId} = this.props;

            return {
                some_cursor:    ['path', 'to', 'some', 'cursor'],
                another_cursor: ['path', 'to', 'another', 'cursor']
                advanced_cursor: {
                    cursor:   ['path', 'to', 'advanced', 'cursor'],
                    setState: oState => {
                        if (oState.advanced_cursor) {
                            oState.advanced_item = oState.advanced_cursor[sSomeId];

                            if (oState.advanced_item) {
                                oState.local_state   = oState.advanced_item.something_interesting;
                            }
                        }
                    }
                },
                local_thing: {
                    cursor: BaobabComponent.LOCAL_STATE,
                    default: null,
                    setState: oState => {
                        console.log('local_thing has been changed to', oState.local_thing);
                    }
                },
                other_local_thing: {
                    cursor: BaobabComponent.LOCAL_STATE,
                    default: null
                }
            };
        }

        constuctor(props, context) {
            super(props, context, Data)
        }

        render() {
            const {
                some_cursor:    aSome,
                another_cursor: aAnother,
                advanced_item:  oAdvancedItem
            } = this.state;

            return (
                <div>
                    <h1>{oAdvancedItem.some_parameter}</h1>

                    {aSome.map(oSomeItem => <SomeComponent item={oSomeItem} />)}

                    <a className="a button" onClick={this.action}>Do Things!</a>
                </div>
            );
        }

        action = oEvent => {
            this.CURSORS.another_cursor.set('x', 1);
            this.CURSORS.other_local_thing.set('What Ever.');
        };
    }
```

## stateQueries

Most of the important stuff happens in the `stateQueries` method, which should return an object that has baobab queries your
component intents to watch

### Setting Cursors

If you're familiar with react-baobab, this should make perfect sense.  You set the cursor path, and then within your component,
and from then on `this.CURSORS.your_cursor_name` is how you can modify the contents of that cursor.  Once modified,
`this.state.your_cursor_name` will always have the contents of `this.CURSORS.your_cursor_name.get()`.

### Adjusting Data

Sometimes you want to adjust the data just before a render, BUT, it's crazy to do that in the render method every time.
Instead, set up a `setState` method for your cursor in the `stateQueries` method and every time the watched cursor
changes, your setState method will run (with the updated state), and whatever you set there will show up during your
next `render`.

That's probably a lot to grok just from a poorly written paragraph.  A demonstration is in order.  One that I'm not
prepared to write at this time.  But I will.  Ideally before 2030.

## Things I'd Like to Try

* Ideally state adjustments would be globalized, and then only run once in the primary tree, and then have the listeners notified of the updates of that one update.  Instead the update will still happen on every component.  It's better than running it in the `render` method (the primary purpose of this library), but it's still not ideal.
* I made this work as an HOC one time
  * It worked fine, using `props` instead of `state` throughout the child component.
  * It was nice to have react's state management back (instead of handing it over to BaobabComponent).
  * Otherwise, there wasn't much benefit to the change.  I may go with it, but it's not currently essential.
