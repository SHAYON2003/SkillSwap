// controllers/progressController.js
const User = require("../models/User");

exports.getProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("skillsOffered skillsWanted progress");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Helper function to merge skill definitions with progress counts
    const mergeSkillsWithProgress = (skillsArray, progressMap) => {
      return skillsArray.map(skill => {
        // First check if there's progress data for this specific skill
        const progressCount = progressMap && progressMap.get ? 
          progressMap.get(skill.name) : 
          (progressMap && progressMap[skill.name]);
        
        return {
          name: skill.name,
          // Prioritize progress count over individual skill swapsCount
          count: progressCount || skill.swapsCount || 0
        };
      });
    };

    // Convert progress Maps to plain objects if needed
    const offeredProgress = user.progress?.offered || {};
    const learnedProgress = user.progress?.learned || {};

    // Merge skills with their progress counts
    const offeredSkills = mergeSkillsWithProgress(
      user.skillsOffered || [], 
      offeredProgress
    );
    
    const wantedSkills = mergeSkillsWithProgress(
      user.skillsWanted || [], 
      learnedProgress
    );

    // Get total swaps count from progress
    const totalSwapsCount = user.progress?.swapsCount || 0;

    // Optional: Get recent completed swaps (you'll need to implement this)
    // const recentSwaps = await Swap.find({ 
    //   $or: [{ requester: req.user }, { offerer: req.user }],
    //   status: 'completed'
    // })
    // .populate('skillOffered skillRequested')
    // .sort({ completedAt: -1 })
    // .limit(8);

    return res.json({
      success: true,
      swapsCount: totalSwapsCount,
      skills: {
        offered: offeredSkills,
        learned: wantedSkills
      },
      progress: {
        swapsCount: totalSwapsCount,
        // Send the raw progress data as backup
        offered: offeredProgress,
        learned: learnedProgress
      },
      recent: [] // recentSwaps || []
    });

  } catch (err) {
    console.error('Progress fetch error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};