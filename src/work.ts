export type Snippet = {
  id: string;
  title: string;
  description: string;
  /** Filename in /work, without extension. A clip plays over its still. */
  asset: string;
  video?: boolean;
  /** Sets the tile's colour behind the asset while it loads. */
  tile: string;
  wide?: boolean;
};

export type WorkGroup = {
  id: string;
  title: string;
  link: string;
  intro: string;
  snippets: Snippet[];
};

export const work: WorkGroup[] = [
  {
    id: "numina",
    title: "Numina",
    link: "https://numina.app",
    intro:
      "Accounting software for Danish businesses, built to be used alongside AI agents. The product is in Danish, so that's what you'll see here.",
    snippets: [
      {
        id: "construction",
        title: "A mascot that draws itself",
        description:
          "The hero of Numina's brand page. Six circles for the head, a centre disc and six small fillets between them, computed from the mascot's own geometry rather than redrawn by hand. Lines draw in from the outer ring towards the face, the tint fades in, and it blinks once.",
        asset: "numina-construction",
        video: true,
        tile: "#ffffff",
        wide: true,
      },
      {
        id: "construction-cards",
        title: "Spec cards",
        description:
          "Each mark outlined on the brand colour, with the circles it's built from dashed behind it. Both are read straight from the source files, so they can't drift from the real logo.",
        asset: "numina-construction-cards",
        tile: "#f5f4ec",
      },
      {
        id: "create-menu",
        title: "One + for everything you add",
        description:
          "Uploading a document and starting an invoice, offer or subscription are all one button beside search, on every page of the app.",
        asset: "numina-create-menu",
        video: true,
        tile: "#ffffff",
      },
      {
        id: "command-menu",
        title: "The command menu knows what you selected",
        description:
          "Select rows in the journal and ⌘K opens on the actions for that selection, while the bar keeps only the frequent ones. It's honest about scope too: “Tilføj bankbilag” only applies to drafts that are reconciled with the bank and have no document, so it says 2 of 4.",
        asset: "numina-command-menu",
        video: true,
        tile: "#ecebe6",
        wide: true,
      },
      {
        id: "expenses",
        title: "Expenses inbox",
        description:
          "A rebuilt list of documents, each with its sender and where it came from. Open one and the document, its journal entry and the matching bank payment sit side by side.",
        asset: "numina-expenses",
        tile: "#ecebe6",
        wide: true,
      },
    ],
  },
  {
    id: "trawle",
    title: "Trawle",
    link: "https://trawle.com",
    intro:
      "A job search engine that reads open roles straight from employers' own applicant tracking systems, with a tracker that works without an account.",
    snippets: [
      {
        id: "board",
        title: "A tracker board you can change your mind on",
        description:
          "Drag a card into any slot, in any stage. Every move lands with an undo in the toast, and the whole board lives in your browser until you sign in.",
        asset: "trawle-board",
        video: true,
        tile: "#e9eeec",
        wide: true,
      },
      {
        id: "selection",
        title: "The logo is the checkbox",
        description:
          "Job rows stay calm until you need them. On hover the logo becomes a checkbox and the actions appear, and picking a row raises a floating bar with what you can do to all of them.",
        asset: "trawle-selection",
        video: true,
        tile: "#ffffff",
      },
      {
        id: "flow",
        title: "Your job hunt, as something to share",
        description:
          "The tracker turns your applications into a flow diagram you can download in light or dark. A ribbon takes the colour of where it's going, so the single pop of coral is the offer. Sample numbers shown here.",
        asset: "trawle-flow",
        tile: "#e9eeec",
      },
      {
        id: "company",
        title: "A company page that opens with the answer",
        description:
          "“Is Render hiring?” comes first, answered in a sentence over its four numbers. The jobs follow beside a rail of data, where each row in a breakdown fills in proportion to the largest and links into the search. The numbers are from a small local sample, not Render's real hiring history.",
        asset: "trawle-company",
        video: true,
        tile: "#e9eeec",
        wide: true,
      },
    ],
  },
];
