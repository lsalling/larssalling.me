import {
  IconBrandGithub,
  IconWorld,
  type TablerIcon,
} from "@tabler/icons-react";
import maellaLogo from "./static/images/maella-icon.png";
import wasabeeLogo from "./static/images/wasabee-icon.png";
import maellaImage from "./static/images/Feed.png";
import wasabeeImage from "./static/images/wasabee-image.png";
import makinImage from "./static/images/makin.png";
import headlessCommerceImage from "./static/images/headless-commerce.png";

export type Project = {
  id: string;
  title: string;
  description: string;
  role: string;
  link?: string;
  prefix?: string;
  color: string;
  icon: ImageMetadata;
  image: {
    src: string;
    alt: string;
  };
  links: {
    label: string;
    href: string;
    icon: TablerIcon;
  }[];
  technologies: {
    name: string;
    logo: string;
  }[];
};

export const projects: Project[] = [
  {
    id: "maella",
    title: "Maella",
    // link: "https://maella.net",
    prefix: "2024 - Present",
    color: "#0e8b67",
    description: `A personal project in the form of a social platform for sharing, publishing and discovering recipes. Features natural language search, allowing users to find recipes based on ingredients, dietary restrictions, or cuisine types.
      \nBuilt with React and Remix. Uses Drizzle for interacting with a Postgres database, React Aria and Tailwind CSS for accessibility and styling. Hosted on AWS with infrastructure handled using SST.
      \nCurrently in development with no public release planned as of now.`,
    icon: maellaLogo,
    role: "Design, development",
    image: {
      src: maellaImage.src,
      alt: "Screenshot of a a news feed on Maella.",
    },
    links: [
      {
        label: "Website",
        href: "https://maella.net",
        icon: IconWorld,
      },
      {
        icon: IconBrandGithub,
        label: "Github",
        href: "https://github.com/lsalling/maella.git",
      },
    ],
    technologies: [
      {
        name: "SST",
        logo: "https://avatars.githubusercontent.com/u/66570915?s=200&v=4",
      },
      {
        name: "Remix",
        logo: "https://avatars.githubusercontent.com/u/64235328?s=200&v=4",
      },
      {
        name: "Drizzle",
        logo: "https://avatars.githubusercontent.com/u/108468352?s=48&v=4",
      },
      {
        name: "React Aria",
        logo: "https://avatars.githubusercontent.com/u/476009?s=200&v=4",
      },
    ],
  },
  {
    id: "wasabee",
    title: "Wasabee",
    prefix: "2022 - Present",
    link: "https://wasabee.app",
    color: "#8fb990",
    description: `Wasabee is a web platform for creating and hosting blogs for recipes and other cooking-related content. The project is built around a multi-tenancy architecture in which customers can host their blog under a subdomain or a custom domain.
    \nThis project was my first venture into building a SaaS and has taught me countless lessons along the way.`,
    icon: wasabeeLogo,
    role: "Design, development",
    image: {
      src: wasabeeImage.src,
      alt: "",
    },
    links: [
      {
        label: "Website",
        href: "https://maella.net",
        icon: IconWorld,
      },
      {
        icon: IconBrandGithub,
        label: "Github",
        href: "https://github.com/lsalling/maella.git",
      },
    ],
    technologies: [
      {
        name: "Next.js",
        logo: "https://nextjs.org/static/favicon/favicon-32x32.png",
      },
    ],
  },
];

export const smallProjects = [
  {
    id: "makinkinematic",
    title: "Makin Kinematic",
    description: `During my time at Kinematic, a company that specializes in GPS and real-time positional awareness of machinery, I was tasked with redesigning and implementing the administration dashboard for their cloud solution.

The design and prototype was created in Figma and incrementally implemented using Vue.js (using Nuxt 3 as a meta framework), Tailwind CSS, Headless UI and tested using Playwright for end-to-end tests.`,
    image: {
      src: makinImage.src,
      alt: "Screenshot of the Makin Kinematic dashboard.",
    },
  },
  {
    id: "headless-commerce",
    title: "Headless Commerce library",
    description: `Headless Commerce is a boilerplate for building performant and scalable webshops using Next.js 14 and headless Shopify. I have previously run my own webshop using headless Shopify, which opened up my eyes to the value of providing an out-of-the-box solution for creating beatiful, performant, and costumizable storefronts with some of the newest web technologies around. This project is still in its early stages.`,
    image: {
      src: headlessCommerceImage.src,
      alt: "Screenshot of a webshop built with the headless commerce library.",
    },
  },
];
