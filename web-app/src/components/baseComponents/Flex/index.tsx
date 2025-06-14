import React from 'react';
import type { ReactNode } from 'react';
import { styled } from '@linaria/react';

import FlexItem from './FlexItem';

interface Props {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  align?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string;
}

const Root = styled.div`
  display: flex;
`;

function Flex(props: Props) {
  const {
    children = null,
    className = '',
    style = {},
    direction,
    justify,
    align,
    wrap,
    gap,
  } = props;
  return (
    <Root
      className={className}
      style={{
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        flexWrap: wrap,
        gap,
        ...style,
      }}
    >
      {children}
    </Root>
  );
}

Flex.Item = FlexItem;

export default Flex;
