import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";

actor {
  type PlayerProgress = {
    levelsCompleted : [Nat];
    levelAttempts : [(Nat, Nat)];
    bestProgress : [(Nat, Nat)];
  };

  type PlayerCustomization = {
    unlockedIcons : [Text];
    unlockedColors : [Text];
    selectedIcon : Text;
    selectedColor : Text;
  };

  type PlayerData = {
    progress : PlayerProgress;
    customization : PlayerCustomization;
  };

  var players : Map.Map<Principal, PlayerData> = Map.empty();

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func getPlayer(caller : Principal) : PlayerData {
    switch (players.get(caller)) {
      case (?data) { data };
      case (null) { Runtime.trap("Player not initialized") };
    };
  };

  func setAttempt(pairs : [(Nat, Nat)], levelId : Nat, value : Nat) : [(Nat, Nat)] {
    var found = false;
    var result = pairs.map(
      func(pair) {
        if (pair.0 == levelId) {
          found := true;
          (levelId, value);
        } else {
          pair;
        };
      }
    );
    if (not found) {
      result := result.concat([(levelId, value)]);
    };
    result;
  };

  func getAttemptValue(pairs : [(Nat, Nat)], levelId : Nat) : Nat {
    for (pair in pairs.vals()) {
      if (pair.0 == levelId) {
        return pair.1;
      };
    };
    0;
  };

  func containsNat(arr : [Nat], value : Nat) : Bool {
    for (v in arr.vals()) {
      if (v == value) {
        return true;
      };
    };
    false;
  };

  func containsText(arr : [Text], value : Text) : Bool {
    for (v in arr.vals()) {
      if (v == value) {
        return true;
      };
    };
    false;
  };

  // Unlockable rewards per level
  func getUnlockIcon(levelId : Nat) : Text {
    switch (levelId) {
      case (1) { "diamond" };
      case (2) { "star" };
      case (3) { "triangle" };
      case (_) { "cube" };
    };
  };

  func getUnlockColor(levelId : Nat) : Text {
    switch (levelId) {
      case (1) { "#00bfff" };
      case (2) { "#ff6600" };
      case (3) { "#ff00ff" };
      case (_) { "#00ff00" };
    };
  };

  public query ({ caller }) func getPlayerData() : async ?PlayerData {
    requireAuth(caller);
    players.get(caller);
  };

  public shared ({ caller }) func initializePlayer() : async () {
    requireAuth(caller);
    switch (players.get(caller)) {
      case (?_) { () };
      case (null) {
        players.add(
          caller,
          {
            progress = {
              levelsCompleted = [];
              levelAttempts = [];
              bestProgress = [];
            };
            customization = {
              unlockedIcons = ["cube"];
              unlockedColors = ["#00ff00"];
              selectedIcon = "cube";
              selectedColor = "#00ff00";
            };
          },
        );
      };
    };
  };

  public shared ({ caller }) func recordLevelAttempt(levelId : Nat) : async () {
    requireAuth(caller);
    let data = getPlayer(caller);
    let current = getAttemptValue(data.progress.levelAttempts, levelId);
    let newAttempts = setAttempt(data.progress.levelAttempts, levelId, current + 1);
    players.add(
      caller,
      {
        data with progress = {
          data.progress with levelAttempts = newAttempts
        }
      },
    );
  };

  public shared ({ caller }) func updateBestProgress(levelId : Nat, percent : Nat) : async () {
    requireAuth(caller);
    if (percent > 100) {
      Runtime.trap("Percent must be 0-100");
    };
    let data = getPlayer(caller);
    let current = getAttemptValue(data.progress.bestProgress, levelId);
    if (percent > current) {
      let newBest = setAttempt(data.progress.bestProgress, levelId, percent);
      players.add(
        caller,
        {
          data with progress = {
            data.progress with bestProgress = newBest
          }
        },
      );
    };
  };

  public shared ({ caller }) func completeLevel(levelId : Nat) : async () {
    requireAuth(caller);
    let data = getPlayer(caller);

    // Add to completed if not already
    var completed = data.progress.levelsCompleted;
    if (not containsNat(completed, levelId)) {
      completed := completed.concat([levelId]);
    };

    // Set best progress to 100
    let newBest = setAttempt(data.progress.bestProgress, levelId, 100);

    // Unlock icon and color rewards
    let rewardIcon = getUnlockIcon(levelId);
    let rewardColor = getUnlockColor(levelId);

    var icons = data.customization.unlockedIcons;
    if (not containsText(icons, rewardIcon)) {
      icons := icons.concat([rewardIcon]);
    };

    var colors = data.customization.unlockedColors;
    if (not containsText(colors, rewardColor)) {
      colors := colors.concat([rewardColor]);
    };

    players.add(
      caller,
      {
        progress = {
          levelsCompleted = completed;
          levelAttempts = data.progress.levelAttempts;
          bestProgress = newBest;
        };
        customization = {
          data.customization with
          unlockedIcons = icons;
          unlockedColors = colors;
        };
      },
    );
  };

  public shared ({ caller }) func selectIcon(icon : Text) : async () {
    requireAuth(caller);
    let data = getPlayer(caller);
    if (not containsText(data.customization.unlockedIcons, icon)) {
      Runtime.trap("Icon not unlocked");
    };
    players.add(
      caller,
      {
        data with customization = {
          data.customization with selectedIcon = icon
        }
      },
    );
  };

  public shared ({ caller }) func selectColor(color : Text) : async () {
    requireAuth(caller);
    let data = getPlayer(caller);
    if (not containsText(data.customization.unlockedColors, color)) {
      Runtime.trap("Color not unlocked");
    };
    players.add(
      caller,
      {
        data with customization = {
          data.customization with selectedColor = color
        }
      },
    );
  };
};
