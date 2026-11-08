const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'player', 'CurriculumAccordion.tsx');
let raw = fs.readFileSync(filePath, 'utf8');
const isCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

const target = `{lesson.isFreePreview && !isEnrolled && (
                        <View style={[styles.previewBadge, { backgroundColor: colors.secondaryLight }]}>
                          <Text style={[styles.previewText, { color: colors.secondary }]}>
                            Preview
                          </Text>
                        </View>
                      )}`;

const replacement = `{lesson.isFreePreview && !isEnrolled && !isAdmin && (
                        <View style={[styles.previewBadge, { backgroundColor: colors.secondaryLight }]}>
                          <Text style={[styles.previewText, { color: colors.secondary }]}>
                            Preview
                          </Text>
                        </View>
                      )}
                      {isAdmin && !isEnrolled && (
                        <View style={[styles.previewBadge, { backgroundColor: 'rgba(255, 182, 6, 0.15)' }]}>
                          <Text style={[styles.previewText, { color: '#B45309', fontWeight: '700' }]}>
                            Admin
                          </Text>
                        </View>
                      )}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  if (isCrlf) content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('CurriculumAccordion badge updated successfully');
} else {
  console.log('Target badge code not found in CurriculumAccordion');
}
