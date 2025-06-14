import baseConfig from '@uxndigital/eslint-config-base';
import reactConfig from '@uxndigital/eslint-config-react';
import type { Linter } from 'eslint';

export default [...baseConfig, ...reactConfig] as Linter.Config[];
