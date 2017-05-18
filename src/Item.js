import React, { Component, PropTypes } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

class Item extends Component {
  static propTypes = {
    scroll: PropTypes.instanceOf(Animated.Value).isRequired,
    position: PropTypes.number.isRequired,
    children: PropTypes.element.isRequired,
    wingSpan: PropTypes.number.isRequired,
    spacing: PropTypes.number.isRequired,
    rotation: PropTypes.number.isRequired,
    midRotation: PropTypes.number.isRequired,
    perspective: PropTypes.number.isRequired,
    scaleDown: PropTypes.number.isRequired,
    scaleFurther: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
  };

  static childContextTypes = {
    animatedPosition: PropTypes.instanceOf(Animated.Interpolation),
  };

  getChildContext() {
    return {
      animatedPosition: null,
    };
  }

  shouldComponentUpdate(nextProps) {
    // Only if the props are different
    return nextProps.position !== this.props.position
      || nextProps.rotation !== this.props.rotation
      || nextProps.midRotation !== this.props.midRotation
      || nextProps.perspective !== this.props.perspective
      || nextProps.scaleDown !== this.props.scaleDown
      || nextProps.scaleFurther !== this.props.scaleFurther
      || nextProps.wingSpan !== this.props.wingSpan
      || nextProps.spacing !== this.props.spacing
      || nextProps.children.key !== this.props.children.key;
  }

  render() {
    const {
      scroll,
      position,
      rotation,
      midRotation,
      perspective,
      scaleDown,
      scaleFurther,
      wingSpan,
      spacing,
      onSelect,
    } = this.props;

    const style = {
      transform: [
        { perspective },
        {
          translateX: scroll.interpolate({
            inputRange: [position - 2, position - 1, position, position + 1, position + 2],
            outputRange: [spacing + wingSpan, spacing, 0, -spacing, -spacing - wingSpan],
          }),
        },
        {
          scale: scroll.interpolate({
            inputRange: [position - 2, position - 1, position, position + 1, position + 2],
            outputRange: [scaleFurther, scaleDown, 1, scaleDown, scaleFurther],
          }),
        },
        {
          rotateY: scroll.interpolate({
            inputRange: [
              position - 2,
              position - 1,
              position - 0.5,
              position,
              position + 0.5,
              position + 1,
              position + 2,
            ],
            outputRange: [
              `-${rotation}deg`,
              `-${rotation}deg`,
              `-${midRotation}deg`,
              '0deg',
              `${midRotation}deg`,
              `${rotation}deg`,
              `${rotation}deg`,
            ],
          }),
        },
      ],
    };

    return (
      <View pointerEvents="box-none" style={styles.container}>
        <TouchableWithoutFeedback onPress={() => onSelect(position)}>
          <Animated.View style={style}>
            {this.props.children}
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

export default Item;
