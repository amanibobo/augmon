const card_data = {
    cards: [
      {
        id: "ninetales-legendary-treasures-21",
        metadata: {
          name: "Ninetales",
          set: "Legendary Treasures",
          hp: 90,
          type: "Fire",
          attacks: [
            {
              name: "Hexed Flame",
              damage: "20+",
              effect:
                "Does 50 more damage for each Special Condition affecting the Defending Pokémon.",
            },
          ],
          weakness: "Water",
          retreat_cost: 1,
          description: "Legends claim that Ninetales live for 1,000 years.",
        },
      },
      {
        id: "scraggy-furious-fists-66",
        metadata: {
          name: "Scraggy",
          set: "Furious Fists",
          hp: 60,
          type: "Darkness",
          attacks: [
            {
              name: "Corkscrew Punch",
              damage: "30",
              effect: "",
            },
          ],
          weakness: "Fighting",
          resistance: "Psychic",
          retreat_cost: 2,
          description:
            "Its skin has a rubbery elasticity, so it can reduce damage by pulling up its skin to shield itself.",
        },
      },
      {
        id: "lapras-next-destinies-25",
        metadata: {
          name: "Lapras",
          set: "Next Destinies",
          hp: 100,
          type: "Water",
          attacks: [
            {
              name: "Call for Family",
              damage: "",
              effect:
                "Search your deck for 2 Basic Pokémon and put them onto your Bench. Shuffle your deck afterward.",
            },
            {
              name: "Reckless Charge",
              damage: "40",
              effect: "This Pokémon does 20 damage to itself.",
            },
          ],
          weakness: "Lightning",
          resistance: "None",
          retreat_cost: 2,
          description: "",
        },
      },
    ],
  };
  
  export default card_data;
  