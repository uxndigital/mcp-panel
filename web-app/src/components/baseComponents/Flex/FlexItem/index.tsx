import React, { ReactNode } from 'react';
import { styled } from '@linaria/react';

interface Props {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  flex?: string;
  alignSelf?:
    | 'auto'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'baseline'
    | 'stretch';
}

const Root = styled.div<any>`
  flex: 0 1 auto;
`;

function FlexItem(props: Props) {
  const {
    children = null,
    className = '',
    style = {},
    flex,
    alignSelf
  } = props;

  return (
    <Root
      className={className}
      style={{
        flex,
        alignSelf,
        ...style
      }}
    >
      {children}
    </Root>
  );
}

export default FlexItem;
