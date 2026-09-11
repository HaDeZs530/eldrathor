# Archetype Base Stat Seeds — DRAFT (Anthony reviewing)

*Built 2026-07-19 by Claude Design Chat on Anthony's parameters. Parameters LOCKED; the table itself is NOT locked — Anthony asked to review before committing. Committed 2026-09-11 as a draft so it isn't lost.*

## Locked parameters (Anthony, 2026-07-19)
- Each archetype = a set of **flat base numbers** across the 9 stats. Not %, not growth curves.
- **Base 10 on every stat; 15 on each archetype's two specialty stats.** All positive — weak stats are neutral, never penalized.
- **Archetype numbers never change.** Growth comes from levels, gear, and gems.
- **Class gems multiply these by %.** Higher seed compounds harder under the same gem — that's where matching pulls ahead, gently.
- Intent: nobody should feel forced into Warden+Healer or Bulwark+Tank. A Bulwark with a Healer gem heals ~⅓ less than a Warden with the same gem, and soaks like a wall. Viable, distinct, not a trap.

## Draft table

| Stat | Bulwark | Warden | Striker | Adept | Resonator |
|---|---|---|---|---|---|
| HP | **15** | 10 | 10 | 10 | 10 |
| Mana | 10 | 10 | 10 | **15** | 10 |
| Mana Regen | 10 | **15** | 10 | 10 | 10 |
| Power | 10 | 10 | **15** | 10 | 10 |
| Worldvein Mitigation | **15** | 10 | 10 | 10 | 10 |
| Attack Speed | 10 | 10 | **15** | 10 | 10 |
| Crit Chance | 10 | 10 | 10 | **15** | 10 |
| Crit Damage | 10 | 10 | 10 | 10 | 10 |
| Healing Power | 10 | **15** | 10 | 10 | 10 |
| *specialty pair* | HP + Mitigation | Healing + Mana Regen | Power + Atk Speed | Mana + Crit Chance | — |

## Notes for review
- **Resonator is all 10s on purpose.** Its value is its exclusive group innate *Attune Vein* (drop rarity / yield / Worldvein gain) — the farming pick. Not weak; its payoff lives off this table.
- **Crit Damage has no archetype home.** Left as a gear/gem stat. Could be handed to Striker as a third lean — recommendation is to leave it.
- What these seeds mean in HP/damage terms depends on the combat resolver's formulas (combat v2) — the *relative* shape is the design; absolute scale is prototype tuning.
