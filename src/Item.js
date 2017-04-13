import React, { Component, PropTypes } from 'react';
import { Animated, TouchableWithoutFeedback, Text, View } from 'react-native';

let  num = 0;

class Item extends Component {
  static propTypes = {
    scroll: PropTypes.instanceOf(Animated.Value).isRequired,
    count: PropTypes.number.isRequired,
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
    animatedPosition: PropTypes.instanceOf(Animated.Value),
  };

  getChildContext() {
    return {
      animatedPosition: null,
    };
  }

  shouldComponentUpdate(nextProps) {
    return false;
  }

  render() {
    const {
      scroll,
      position,
      rotation,
      midRotation,
      perspective,
      count,
      scaleDown,
      scaleFurther,
      wingSpan,
      spacing,
      onSelect,
    } = this.props;
    const extremeLeft = Math.min(position - 2, position - (count / 2));
    const extremeRight = Math.max(position + 2, position + (count / 2));
    // console.log(temp);
    // temp.addListener((v) => {
    //   console.log('Value is', v);
    // });

    const style = {
      transform: [
        { perspective },
        {
          translateX: scroll.interpolate({
            inputRange: [extremeLeft, position - 1, position, position + 1, extremeRight],
            outputRange: [wingSpan, spacing, 0, -spacing, -wingSpan],
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
            inputRange: [position - 2, position - 1, position - 0.5, position, position + 0.5, position + 1, position + 2],
            outputRange: [`-${rotation}deg`, `-${rotation}deg`, `-${midRotation}deg`, '0deg', `${midRotation}deg`, `${rotation}deg`, `${rotation}deg`],
          }),
        },
      ],
    };

    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TouchableWithoutFeedback
          onPressIn={() => console.log('On press in')}
          onPressOut={() => console.log('On Press out')}
          onPress={() => onSelect(position)}
        >
          <Animated.View style={style}>
            {this.props.children}
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

export default Item;
