import type { ReactNode } from "react";

export interface ReceiptProps {
  routeLabel: string;
  baseFare: number;
  baseQuarter: string;
  /** Log-point channels from farePrediction. */
  concentrationChannel: number;
  commonOwnershipChannel: number;
  settingsLabel: string;
  /** e.g. "coral" camp accent for the disputed line. */
  disputedColor: string;
  footnote: ReactNode;
}

/** Restrained-editorial fare receipt: the prediction itemized like an
 * airline fee breakdown, with the disputed line wearing its camp color. */
export function Receipt({
  routeLabel,
  baseFare,
  baseQuarter,
  concentrationChannel,
  commonOwnershipChannel,
  settingsLabel,
  disputedColor,
  footnote,
}: ReceiptProps) {
  // Exact decomposition: base · e^conc · e^co = predicted.
  const concDollars = baseFare * (Math.exp(concentrationChannel) - 1);
  const coDollars =
    baseFare * Math.exp(concentrationChannel) * (Math.exp(commonOwnershipChannel) - 1);
  const predicted = baseFare + concDollars + coDollars;
  const pct = (predicted / baseFare - 1) * 100;
  const money = (v: number, signed = false) =>
    `${signed ? (v >= 0 ? "+ " : "− ") : ""}$${Math.abs(v).toFixed(2)}`;

  return (
    <div className="receipt">
      <div className="receipt-head">
        <span>Fare adjustment notice</span>
        <span>{routeLabel}</span>
      </div>
      <div className="receipt-line">
        <span>Average fare today ({baseQuarter})</span>
        <span>{money(baseFare)}</span>
      </div>
      <div className="receipt-line">
        <span>Concentration charge (ordinary market power)</span>
        <span>{money(concDollars, true)}</span>
      </div>
      <div className="receipt-line disputed" style={{ color: disputedColor }}>
        <span>Common-ownership premium — disputed</span>
        <span>{money(coDollars, true)}</span>
      </div>
      <div className="receipt-total">
        <span>Predicted average fare</span>
        <span>
          {money(predicted)}{" "}
          <em>
            ({pct >= 0 ? "+" : ""}
            {pct.toFixed(1)}%)
          </em>
        </span>
      </div>
      <div className="receipt-settings">Settings: {settingsLabel}</div>
      <div className="receipt-foot">{footnote}</div>
    </div>
  );
}
