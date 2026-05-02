import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const siteUrl = process.env.DOCUSAURUS_URL ?? 'http://localhost:3040';
/** Same-origin root for the Next app (not under `/docs`). Uses `DOCUSAURUS_URL` at build time. */
const nextAppRoot = new URL('/', siteUrl).href;

const config: Config = {
  title: 'HiveClaw',
  tagline: 'Documentation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: siteUrl,
  baseUrl: '/docs/',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'HiveClaw',
      logo: {
        alt: 'HiveClaw',
        src: 'img/logo.svg',
        href: nextAppRoot,
        target: '_self',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: nextAppRoot,
          label: 'Site home',
          position: 'right',
          target: '_self',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/',
            },
            {
              label: 'Quickstart',
              to: '/getting-started/quickstart',
            },
            {
              label: 'Configuration',
              to: '/configuration/environment',
            },
            {
              label: 'Contracts',
              to: '/contracts/testnet-deploy',
            },
            {
              label: 'CLI',
              to: '/cli/reference',
            },
            {
              label: 'OpenClaw plugin',
              to: '/openclaw/plugin',
            },
            {
              label: 'Concepts',
              to: '/concepts/overview',
            },
            {
              label: 'Dashboard',
              to: '/dashboard/overview',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} HiveClaw. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
