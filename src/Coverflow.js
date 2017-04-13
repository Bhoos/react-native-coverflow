import React, { Component, PropTypes, Children } from 'react';
import { Animated, View, PanResponder, StyleSheet, Platform } from 'react-native';

import Item from './Item';

const SENSITIVITY_LOW = 'low';
const SENSITIVITY_HIGH = 'high';
const SENSITIVITY_NORMAL = 'normal';

function convertSensitivity(sensitivity) {
  switch (sensitivity) {
    case SENSITIVITY_LOW:
      return 120;
    case SENSITIVITY_HIGH:
      return 40;
    case SENSITIVITY_NORMAL:
    default:
      return 60;
  }
}

function mapPropsToState(props, { width, selection }) {
  const sel = selection || 0;
  return {
    pageWidth: convertSensitivity(props.sensitivity),
    children: fixOrder(Children.toArray(props.children), sel),
    width,
  };
}

function getAnimatedValue(v) {
  // eslint-disable-next-line no-underscore-dangle
  return v.__getValue();
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function clamp(value, min, max) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function fixOrder(items, selection) {
  // Fix the order of children
  const children = [];
  for (let i = 0; i < selection; i += 1) {
    children.push([i, items[i]]);
  }

  for (let i = items.length - 1; i > selection; i -= 1) {
    children.push([i, items[i]]);
  }

  children.push([selection, items[selection]]);

  return children;
}

class Coverflow extends Component {
  static propTypes = {
    style: View.propTypes.style,
    sensitivity: PropTypes.oneOf([SENSITIVITY_LOW, SENSITIVITY_NORMAL, SENSITIVITY_HIGH]),
    initialSelection: PropTypes.number,
    spacing: PropTypes.number,
    wingSpan: PropTypes.number,
    rotation: PropTypes.number,
    midRotation: PropTypes.number,
    perspective: PropTypes.number,
    scaleDown: PropTypes.number,
    scaleFurther: PropTypes.number,
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
    onChange: PropTypes.func.isRequired,
  };

  static defaultProps = {
    initialSelection: 0,
    style: undefined,
    sensitivity: SENSITIVITY_NORMAL,
    spacing: 100,
    wingSpan: 300,
    rotation: 50,
    midRotation: 50,
    perspective: 800,
    scaleDown: 0.8,
    scaleFurther: 0.75,
  };

  constructor(props) {
    super(props);

    this.state = {
      width: 0,
      scrollX: new Animated.Value(0),
      selection: props.initialSelection,
      children: fixOrder(Children.toArray(props.children), props.initialSelection),
    };
  }

  componentWillMount() {
    let offset = 0;
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => (
        // Since we want to handle presses on individual items as well
        // Only start the pan responder when there is some movement
        Math.abs(gestureState.dx) > 15
      ),
      onPanResponderGrant: () => {
        offset = getAnimatedValue(this.state.scrollX);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // change the scroll value with the drag event
        const { pageWidth, scrollX } = this.state;
        scrollX.setValue(offset - (gestureState.dx / pageWidth));
        console.log('Velocity', gestureState.vx, gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { pageWidth, scrollX } = this.state;
        const count = Children.count(this.props.children);
        // console.log('Release Velocity', gestureState.vx, gestureState.dx);
        // const velocity = Math.abs(gestureState.vx);
        // const deceleration = 0.5;


        // const { pageWidth, scrollX } = this.state;
        // // TODO: Calculate displacement based on velocity
        // const time = velocity / deceleration;
        // console.log('Calculated Time', time);
        // const displacement = Math.sign(gestureState.vx) * ((velocity * time) - ((deceleration * time * time) / 2));
        // console.log('Additional Displacement', displacement, 'from', scrollX.__getValue());
        // const finalPos = Math.min(count - 1,
        //   Math.max(0,
        //     Math.round(scrollX.__getValue() - (displacement))));
        // console.log('Final Position', finalPos);
        // const s = scrollX.__getValue() - finalPos;
        // const a = (velocity * velocity) / (2 * s);
        // console.log('Effective Deceleration', a);
        // const t = Math.abs(velocity / a);
        // console.log('Using time', t);

        const pageVelocity = gestureState.vx / pageWidth;
        if (scrollX.__getValue() > 0 && scrollX.__getValue() < count && Math.abs(pageVelocity) > (1 / pageWidth)) {
          const velocity = Math.sign(gestureState.vx) * clamp(Math.abs(pageVelocity), 1 / pageWidth, 5 / pageWidth);
          console.log('Velocity', velocity);
          Animated.decay(scrollX, {
            velocity: -velocity,
            deceleration: 0.99,
          }).start(() => {
            console.log('Decay complete');
            const pos = clamp(Math.round(scrollX.__getValue()), 0, count - 1);
            Animated.spring(scrollX, {
              toValue: pos,
            }).start();
          });
        } else {
          const pos = clamp(Math.round(scrollX.__getValue()), 0, count - 1);
          Animated.spring(scrollX, {
            toValue: pos,
          }).start();
        }

        // // Snap to an item
        // Animated.spring(scrollX, {
        //   toValue: finalPos,
        // }).start();
      },
    });

    this.listenerId = this.state.scrollX.addListener(this.fixChildOrder);
  }

  fixChildOrder = ({ value }) => {
    const { children } = this.props;

    const newSelection = clamp(Math.round(value), 0, Children.count(children) - 1);
    if (newSelection !== this.state.selection) {
      this.setState({
        selection: newSelection,
        children: fixOrder(Children.toArray(this.props.children), newSelection),
      });
    }
  }

  componentWillUnmount() {
    this.state.scrollX.removeListener(this.listenerId);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(mapPropsToState(nextProps, this.state));
  }

  onLayout = ({ nativeEvent }) => {
    const state = mapPropsToState(this.props, { width: nativeEvent.layout.width });
    this.setState(state);
  }

  select = (idx) => {
    const { scrollX } = this.state;
    Animated.spring(scrollX, {
      toValue: idx,
    }).start();
  }

  renderItem = ([position, item]) => {
    if (!this.state.width) {
      return null;
    }

    const { scrollX } = this.state;
    const { rotation, midRotation, perspective, children, scaleDown, scaleFurther, spacing, wingSpan } = this.props;
    const count = Children.count(children);

    return (
      <Item
        key={item.key}
        scroll={scrollX}
        position={position}
        count={count}
        spacing={spacing}
        wingSpan={wingSpan}
        rotation={rotation}
        midRotation={midRotation}
        perspective={perspective}
        scaleDown={scaleDown}
        scaleFurther={scaleFurther}
        onSelect={this.select}
      >
        {item}
      </Item>
    );
  }

  render() {
    const {
      style,
      rotation,
      midRotation,
      scaleDown,
      scaleFurther,
      perspective,
      spacing,
      wingSpan,
      ...props
    } = this.props;
    const { children } = this.state;
    console.log('Rendering children', children.length);
    return (
      <View
        style={[styles.container, style]}
        {...props}
        onLayout={this.onLayout}
        {...this.panResponder.panHandlers}
      >
        {children.map(this.renderItem)}
      </View>
    );
  }
}

export default Coverflow;
