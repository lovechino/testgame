{
  "sdkVersion": "1.0.0",
  "source": "simulator",
  "sessionId": "u88o3l9lhqmyy6e05e",
  "gameId": "com.iruka.listen-color-x-game",
  "lessonId": "lessonId",
  "gameVersion": "1.0.0",
  "type": "COMPLETE",
  "payload": {
    "timeMs": 54246,
    "score": 5,
    "extras": {
      "reason": "user_exit",
      "session_summary": {
        "selection_phase": {
          "action": "chọn đúng con vật",
          "is_correct": true,
          "time_spent": 0
        },
        "painting_phase": {
          "Char_01": {
            "spills_pixels": 0,
            "hints_used": 0,
            "completed": true
          },
          "Shape_01": {
            "spills_pixels": 0,
            "hints_used": 1,
            "completed": true
          },
          "Shape_02": {
            "spills_pixels": 0,
            "hints_used": 0,
            "completed": true
          },
          "Shape_03": {
            "spills_pixels": 0,
            "hints_used": 1,
            "completed": true
          }
        }
      },
      "stats": {
        "accuracy": 1,
        "completion": 1,
        "hintCount": 2,
        "mistakeCount": 0,
        "retryCount": 1,
        "outcome": "pass",
        "finalScore": 5,
        "bestScore": 5,
        "completion_history": [
          {
            "attemptIndex": 1,
            "correct": 7,
            "wrong": 0,
            "total": 4,
            "completion": 1,
            "accuracy": 1,
            "finalScore": 7,
            "startedAtMs": 942.8000000119209,
            "outcome": "pass",
            "questionDurationsMs": [
              1686,
              28989.80000001192,
              1189.300000011921,
              44048.80000001192
            ],
            "endedAtMs": 96671.30000001192
          },
          {
            "attemptIndex": 2,
            "correct": 7,
            "wrong": 0,
            "total": 4,
            "completion": 1,
            "accuracy": 1,
            "finalScore": 7,
            "startedAtMs": 942.8000000119209,
            "outcome": "quit",
            "questionDurationsMs": [
              1686,
              28989.80000001192,
              1189.300000011921,
              44048.80000001192
            ],
            "endedAtMs": 99190.5
          }
        ],
        "items_total": 7,
        "items": [
          {
            "item_id": "select_01",
            "item_type": "select",
            "seq": 1,
            "run_seq": 1,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_SELECT_01",
            "scene_seq": 1,
            "scene_type": "select",
            "expected": {
              "item_id_override": "select_01",
              "question_type": "identify_one",
              "correct_option": "s1_item_spring_correct",
              "options": [
                {
                  "id": "s1_item_spring_correct"
                },
                {
                  "id": "s1_item_summer"
                },
                {
                  "id": "s1_item_winter"
                }
              ],
              "has_submit_button": false
            },
            "history": [
              {
                "attempt": 1,
                "presented_at_ms": 1773407433643,
                "selected_at_ms": 1773407435326,
                "time_response_ms": 1683,
                "response": {
                  "selected_option": "s1_item_spring_correct",
                  "change_before_submit": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Char_01",
            "item_label": "Chữ x",
            "item_type": "paint-char",
            "seq": 4,
            "run_seq": 1,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 4,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Char_01",
              "item_type_override": "paint-char",
              "regions": [
                {
                  "id": "Char_01",
                  "key": "s2_part_2_1",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773407467300,
                "ended_at_ms": 1773407467300,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Char_01",
                      "area_px": 11037,
                      "paint_in_px": 9871,
                      "paint_out_px": 0,
                      "coverage": 0.8844982078853046,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 9871,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.8844982078853046,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              },
              {
                "attempt": 2,
                "started_at_ms": 1773407468878,
                "ended_at_ms": 1773407468879,
                "time_spent_ms": 1,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Char_01",
                      "area_px": 0,
                      "paint_in_px": 536,
                      "paint_out_px": 0,
                      "coverage": 0.048028673835125435,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 536,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.048028673835125435,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "select_01",
            "item_type": "select",
            "seq": 1,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_SELECT_01",
            "scene_seq": 1,
            "scene_type": "select",
            "expected": {
              "item_id_override": "select_01",
              "question_type": "identify_one",
              "correct_option": "s1_item_spring_correct",
              "options": [
                {
                  "id": "s1_item_spring_correct"
                },
                {
                  "id": "s1_item_summer"
                },
                {
                  "id": "s1_item_winter"
                }
              ],
              "has_submit_button": false
            },
            "history": [
              {
                "attempt": 1,
                "presented_at_ms": 1773407473241,
                "selected_at_ms": 1773407474429,
                "time_response_ms": 1188,
                "response": {
                  "selected_option": "s1_item_spring_correct",
                  "change_before_submit": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Shape_01",
            "item_label": "Đĩa",
            "item_type": "paint-shape",
            "seq": 1,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 1,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Shape_01",
              "item_type_override": "paint-shape",
              "regions": [
                {
                  "id": "Shape_01",
                  "key": "s2_part_1_1",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 2,
                "started_at_ms": 1773407513298,
                "ended_at_ms": 1773407513298,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_01",
                      "area_px": 16319,
                      "paint_in_px": 5208,
                      "paint_out_px": 0,
                      "coverage": 0.7947504959560506,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 5208,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.7947504959560506,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              },
              {
                "attempt": 3,
                "started_at_ms": 1773407518660,
                "ended_at_ms": 1773407518660,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_01",
                      "area_px": 0,
                      "paint_in_px": 769,
                      "paint_out_px": 0,
                      "coverage": 0.11735083168014648,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 769,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.11735083168014648,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 1
          },
          {
            "item_id": "Shape_02",
            "item_label": "Bánh trên",
            "item_type": "paint-shape",
            "seq": 2,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 2,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Shape_02",
              "item_type_override": "paint-shape",
              "regions": [
                {
                  "id": "Shape_02",
                  "key": "s2_part_1_2",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773407516918,
                "ended_at_ms": 1773407516918,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_02",
                      "area_px": 11841,
                      "paint_in_px": 4521,
                      "paint_out_px": 0,
                      "coverage": 0.9554099746407438,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 4521,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.9554099746407438,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Shape_03",
            "item_label": "Bánh dưới",
            "item_type": "paint-shape",
            "seq": 3,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 3,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Shape_03",
              "item_type_override": "paint-shape",
              "regions": [
                {
                  "id": "Shape_03",
                  "key": "s2_part_1_3",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773407482877,
                "ended_at_ms": 1773407482877,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_03",
                      "area_px": 8992,
                      "paint_in_px": 524,
                      "paint_out_px": 0,
                      "coverage": 0.14624616243371477,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 524,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.14624616243371477,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              },
              {
                "attempt": 3,
                "started_at_ms": 1773407515299,
                "ended_at_ms": 1773407515300,
                "time_spent_ms": 1,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_03",
                      "area_px": 0,
                      "paint_in_px": 2426,
                      "paint_out_px": 0,
                      "coverage": 0.677086240580519,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 2426,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.677086240580519,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              },
              {
                "attempt": 4,
                "started_at_ms": 1773407520275,
                "ended_at_ms": 1773407520275,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_03",
                      "area_px": 0,
                      "paint_in_px": 506,
                      "paint_out_px": 0,
                      "coverage": 0.14122243929667877,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 506,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.14122243929667877,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 1
          },
          {
            "item_id": "Char_01",
            "item_label": "Chữ x",
            "item_type": "paint-char",
            "seq": 4,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 4,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Char_01",
              "item_type_override": "paint-char",
              "regions": [
                {
                  "id": "Char_01",
                  "key": "s2_part_2_1",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773407524963,
                "ended_at_ms": 1773407524963,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x3dd2ff",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Char_01",
                      "area_px": 11037,
                      "paint_in_px": 10148,
                      "paint_out_px": 0,
                      "coverage": 0.9093189964157706,
                      "spill_ratio": 0,
                      "selected_color": "0x3dd2ff"
                    }
                  ],
                  "total_paint_in_px": 10148,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.9093189964157706,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          }
        ],
        "items_summary_by_type": {
          "select": {
            "item_type": "select",
            "itemsCount": 2,
            "passCount": 2,
            "failCount": 0,
            "quitCount": 0,
            "attemptsTotal": 2,
            "attemptsAvg": 1,
            "hintTotal": 0,
            "hintAvg": 0,
            "timeTotalMs": 2871,
            "timeAvgMs": 1435.5,
            "errors": {},
            "metrics": {
              "changeBeforeSubmitTotal": 0,
              "judgedCount": 2,
              "correctPick": 2,
              "timeResponseAvgMs": 1435.5,
              "pickAccuracy": 1,
              "wrongRepeatCount": 0
            }
          },
          "paint-char": {
            "item_type": "paint-char",
            "itemsCount": 2,
            "passCount": 2,
            "failCount": 0,
            "quitCount": 0,
            "attemptsTotal": 3,
            "attemptsAvg": 1.5,
            "hintTotal": 0,
            "hintAvg": 0,
            "timeTotalMs": 1,
            "timeAvgMs": 0.5,
            "errors": {},
            "metrics": {
              "colorChangeTotal": 0,
              "brushChangeTotal": 0,
              "paintInPxTotal": 20555,
              "paintOutPxTotal": 0,
              "areaTotal": 22074,
              "colorsUsed": [
                "0x3dd2ff"
              ],
              "spillAvg": 0,
              "completionAvg": 0.9209229390681004
            }
          },
          "paint-shape": {
            "item_type": "paint-shape",
            "itemsCount": 3,
            "passCount": 3,
            "failCount": 0,
            "quitCount": 0,
            "attemptsTotal": 6,
            "attemptsAvg": 2,
            "hintTotal": 2,
            "hintAvg": 0.6666666666666666,
            "timeTotalMs": 1,
            "timeAvgMs": 0.3333333333333333,
            "errors": {},
            "metrics": {
              "colorChangeTotal": 0,
              "brushChangeTotal": 0,
              "paintInPxTotal": 13954,
              "paintOutPxTotal": 0,
              "areaTotal": 37152,
              "colorsUsed": [
                "0x3dd2ff"
              ],
              "spillAvg": 0,
              "completionAvg": 0.9440220481959511
            }
          }
        },
        "items_errors_histogram": {}
      }
    }
  }
}