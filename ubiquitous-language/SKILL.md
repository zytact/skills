name ubiquitous-language
description Extract a DDD-style ubiquitous language glossary from the current conversation, flagging ambiguities and proposing canonical terms. Saves to UBIQUITOUS_LANGUAGE.md and records its existence in AGENTS.md and/or CLAUDE.md. Use when user wants to define domain terms, build a glossary, harden terminology, create a ubiquitous language, or mentions "domain model" or "DDD".
disable-model-invocation true

# Ubiquitous Language

Extract and formalize domain terminology from the current conversation into a consistent glossary, saved to a local file.

## Process

1. Scan the conversation for domain-relevant nouns, verbs, and concepts
2. Identify problems:
   - Same word used for different concepts (ambiguity)
   - Different words used for the same concept (synonyms)
   - Vague or overloaded terms
3. Propose a canonical glossary with opinionated term choices
4. Write to `UBIQUITOUS_LANGUAGE.md` in the working directory using the format below
5. Update `AGENTS.md` and/or `CLAUDE.md` so future agents know `UBIQUITOUS_LANGUAGE.md` exists and should be read when domain terminology, product concepts, naming, or business rules matter
6. Output a summary inline in the conversation

## Agent instruction file update

After writing or updating `UBIQUITOUS_LANGUAGE.md`, check for `AGENTS.md` and `CLAUDE.md` in the working directory.

- If either file exists, update each existing file.
- If neither file exists, create `AGENTS.md`.
- Do not duplicate an existing instruction if one already mentions `UBIQUITOUS_LANGUAGE.md`.
- Prefer adding this under an existing project context, documentation, or agent guidance section.
- If no suitable section exists, add a short section like this:

    ## Ubiquitous language

    This repo has a domain glossary at `UBIQUITOUS_LANGUAGE.md`.

    Read it when working on domain terminology, product concepts, naming, business rules, user-facing language, or when interpreting ambiguous terms. Prefer the canonical terms defined there, and avoid aliases listed as discouraged.

## Output Format

Write a `UBIQUITOUS_LANGUAGE.md` file with this structure:

    # Ubiquitous Language

    ## Order lifecycle

    | Term        | Definition                                              | Aliases to avoid      |
    | ----------- | ------------------------------------------------------- | --------------------- |
    | **Order**   | A customer's request to purchase one or more items      | Purchase, transaction |
    | **Invoice** | A request for payment sent to a customer after delivery | Bill, payment request |

    ## People

    | Term         | Definition                                  | Aliases to avoid       |
    | ------------ | ------------------------------------------- | ---------------------- |
    | **Customer** | A person or organization that places orders | Client, buyer, account |
    | **User**     | An authentication identity in the system    | Login, account         |

    ## Relationships

    - An **Invoice** belongs to exactly one **Customer**
    - An **Order** produces one or more **Invoices**

    ## Example dialogue

    > **Dev:** "When a **Customer** places an **Order**, do we create the **Invoice** immediately?"
    > **Domain expert:** "No — an **Invoice** is only generated once a **Fulfillment** is confirmed. A single **Order** can produce multiple **Invoices** if items ship in separate **Shipments**."
    > **Dev:** "So if a **Shipment** is cancelled before dispatch, no **Invoice** exists for it?"
    > **Domain expert:** "Exactly. The **Invoice** lifecycle is tied to the **Fulfillment**, not the **Order**."

    ## Flagged ambiguities

    - "account" was used to mean both **Customer** and **User** — these are distinct concepts: a **Customer** places orders, while a **User** is an authentication identity that may or may not represent a **Customer**.

## Rules

- Be opinionated. When multiple words exist for the same concept, pick the best one and list the others as aliases to avoid.
- Flag conflicts explicitly. If a term is used ambiguously in the conversation, call it out in the "Flagged ambiguities" section with a clear recommendation.
- Only include terms relevant for domain experts. Skip the names of modules or classes unless they have meaning in the domain language.
- Keep definitions tight. One sentence max. Define what it IS, not what it does.
- Show relationships. Use bold term names and express cardinality where obvious.
- Only include domain terms. Skip generic programming concepts (array, function, endpoint) unless they have domain-specific meaning.
- Group terms into multiple tables when natural clusters emerge.
- Write an example dialogue. A short conversation between a dev and a domain expert that demonstrates how the terms interact naturally.
- Keep `AGENTS.md` and/or `CLAUDE.md` updates minimal. They should point agents to the glossary, not duplicate the glossary.

## Re-running

When invoked again in the same conversation:

1. Read the existing `UBIQUITOUS_LANGUAGE.md`
2. Incorporate any new terms from subsequent discussion
3. Update definitions if understanding has evolved
4. Re-flag any new ambiguities
5. Rewrite the example dialogue to incorporate new terms
6. Ensure `AGENTS.md` and/or `CLAUDE.md` still mention `UBIQUITOUS_LANGUAGE.md`
