import { useState, useEffect } from 'react';

export default function useRoundForm(currentRoundId) {
  const [bids, setBids] = useState({});
  const [touchedBids, setTouchedBids] = useState(new Set());
  const [tricks, setTricks] = useState({});
  const [bonuses, setBonuses] = useState({});
  const [kraken, setKraken] = useState(false);

  useEffect(() => {
    setBids({});
    setTouchedBids(new Set());
    setTricks({});
    setBonuses({});
    setKraken(false);
  }, [currentRoundId]);

  const resetWithData = (newBids, newTricks, newBonuses) => {
    setBids(newBids);
    setTricks(newTricks);
    setBonuses(newBonuses);
  };

  return { bids, setBids, touchedBids, setTouchedBids, tricks, setTricks, bonuses, setBonuses, kraken, setKraken, resetWithData };
}
