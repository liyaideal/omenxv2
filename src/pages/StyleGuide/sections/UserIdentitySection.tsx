import { useState } from "react";
import { RefreshCw, Copy, Check, User, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import sillyname from "sillyname";
import { SectionWrapper, SubSection } from "../components";
import { DemoAccountsBlock } from "@/components/auth/DemoAccountsBlock";
import { GoogleAccountChooser } from "@/components/auth/GoogleAccountChooser";
import { 
  AVATAR_SEEDS, 
  AVATAR_BACKGROUNDS, 
  generateAvatarUrl, 
  getRandomAvatarUrl 
} from "@/hooks/useUserProfile";

interface UserIdentitySectionProps {
  isMobile: boolean;
}

export const UserIdentitySection = ({ isMobile }: UserIdentitySectionProps) => {
  // Username playground state
  const [generatedUsername, setGeneratedUsername] = useState(() => {
    const raw = sillyname();
    return raw.replace(/ /g, '_');
  });
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Avatar playground state
  const [selectedSeed, setSelectedSeed] = useState(AVATAR_SEEDS[0]);
  const [selectedBgIndex, setSelectedBgIndex] = useState(0);
  const [randomAvatarUrl, setRandomAvatarUrl] = useState(getRandomAvatarUrl);
  const [copiedAvatarUrl, setCopiedAvatarUrl] = useState(false);

  // Google account chooser playground state (preview-only, no real sign-in)
  const [chooserOpen, setChooserOpen] = useState(false);

  const handleGenerateUsername = () => {
    const raw = sillyname();
    setGeneratedUsername(raw.replace(/ /g, '_'));
  };

  const handleCopyUsername = async () => {
    await navigator.clipboard.writeText(generatedUsername);
    setCopiedUsername(true);
    toast.success("Username copied!");
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const handleRandomAvatar = () => {
    setRandomAvatarUrl(getRandomAvatarUrl());
  };

  const handleCopyAvatarUrl = async () => {
    const url = generateAvatarUrl(selectedSeed, selectedBgIndex);
    await navigator.clipboard.writeText(url);
    setCopiedAvatarUrl(true);
    toast.success("Avatar URL copied!");
    setTimeout(() => setCopiedAvatarUrl(false), 2000);
  };

  const currentAvatarUrl = generateAvatarUrl(selectedSeed, selectedBgIndex);

  return (
    <SectionWrapper 
      id="user-identity"
      title="User Identity" 
      description="Username generation and default avatar system for new users"
    >
      {/* Username Generation */}
      <SubSection title="Username Auto-Generation" description="Using sillyname library to generate friendly random usernames">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">sillyname Generator</CardTitle>
            </div>
            <CardDescription className="text-sm">
              New users without a username are automatically assigned a random "silly name" with spaces replaced by underscores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logic explanation */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Generation Logic:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Import <code className="text-xs bg-muted px-1.5 py-0.5 rounded">sillyname</code> library</li>
                <li>Call <code className="text-xs bg-muted px-1.5 py-0.5 rounded">sillyname()</code> to get a random name (e.g., "Fluffy Bunny")</li>
                <li>Replace spaces with underscores: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">name.replace(/ /g, '_')</code></li>
                <li>Result: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Fluffy_Bunny</code></li>
              </ol>
            </div>

            {/* Code example */}
            <div className="bg-zinc-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-100">
                <code>{`import sillyname from "sillyname";

// Generate username for new user
const rawUsername = sillyname();
const username = rawUsername.replace(/ /g, '_');

// Example outputs:
// "Silly_Penguin"
// "Happy_Dolphin"  
// "Fuzzy_Koala"`}</code>
              </pre>
            </div>

            {/* Interactive Playground */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Playground</span>
                <Badge variant="outline" className="text-xs">Interactive</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-lg">
                  {generatedUsername}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUsername}
                  className="shrink-0"
                >
                  {copiedUsername ? <Check className="w-4 h-4 text-trading-green" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={handleGenerateUsername}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SubSection>

      {/* Avatar Generation */}
      <SubSection title="Default Avatar System" description="Using DiceBear adventurer-neutral style for user avatars">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">DiceBear Adventurer-Neutral</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Default avatars are generated using DiceBear's adventurer-neutral style with predefined seeds and background colors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Info */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">API Endpoint:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=&#123;seed&#125;&backgroundColor=&#123;bg&#125;
              </code>
            </div>

            {/* Background Colors */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Background Colors ({AVATAR_BACKGROUNDS.length} options):</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_BACKGROUNDS.map((bg, index) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBgIndex(index)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      selectedBgIndex === index 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-border hover:border-primary/50"
                    }`}
                    style={{ backgroundColor: `#${bg}` }}
                    title={`#${bg}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Colors: {AVATAR_BACKGROUNDS.map(bg => `#${bg}`).join(", ")}
              </p>
            </div>

            {/* Seed Examples */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Available Seeds ({AVATAR_SEEDS.length} options):</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {AVATAR_SEEDS.slice(0, 30).map((seed) => (
                  <button
                    key={seed}
                    onClick={() => setSelectedSeed(seed)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      selectedSeed === seed
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    {seed}
                  </button>
                ))}
                <span className="px-2 py-1 text-xs text-muted-foreground">
                  +{AVATAR_SEEDS.length - 30} more...
                </span>
              </div>
            </div>

            {/* Code example */}
            <div className="bg-zinc-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-100">
                <code>{`import { generateAvatarUrl, getRandomAvatarUrl } from "@/hooks/useUserProfile";

// Generate specific avatar
const avatarUrl = generateAvatarUrl("felix", 0);
// => https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=felix&backgroundColor=b6e3f4

// Generate random avatar
const randomAvatar = getRandomAvatarUrl();`}</code>
              </pre>
            </div>

            {/* Interactive Playground */}
            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avatar Playground</span>
                <Badge variant="outline" className="text-xs">Interactive</Badge>
              </div>
              
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                {/* Custom Avatar */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Custom (seed: {selectedSeed})</p>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-full overflow-hidden border-2 border-border"
                      style={{ backgroundColor: `#${AVATAR_BACKGROUNDS[selectedBgIndex]}` }}
                    >
                      <img 
                        src={currentAvatarUrl} 
                        alt="Custom avatar"
                        className="w-full h-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAvatarUrl}
                    >
                      {copiedAvatarUrl ? <Check className="w-4 h-4 mr-1.5 text-trading-green" /> : <Copy className="w-4 h-4 mr-1.5" />}
                      Copy URL
                    </Button>
                  </div>
                </div>

                {/* Random Avatar */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Random Generator</p>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted">
                      <img 
                        src={randomAvatarUrl} 
                        alt="Random avatar"
                        className="w-full h-full"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRandomAvatar}
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      Randomize
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Grid Preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Sample Avatars Grid:</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {AVATAR_SEEDS.slice(0, 20).map((seed, index) => (
                  <div
                    key={seed}
                    className="aspect-square rounded-full overflow-hidden border border-border"
                    style={{ backgroundColor: `#${AVATAR_BACKGROUNDS[index % AVATAR_BACKGROUNDS.length]}` }}
                  >
                    <img 
                      src={generateAvatarUrl(seed, index)} 
                      alt={seed}
                      className="w-full h-full"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </SubSection>

      {/* Google Account Chooser playground */}
      <SubSection
        title="Google account chooser"
        description="登录弹窗里 Sign in with Google 触发的账号选择器。此处为 preview 模式：点固定账号只 toast，不真登录。"
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">GoogleAccountChooser</CardTitle>
            </div>
            <CardDescription className="text-sm">
              固定账号 Alex Carter → matched · Mia Reyes → welcome · Use another account → 走匿名新号流程。
              桌面 Dialog / 移动 bottom sheet 自动切换。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => setChooserOpen(true)}>
              Open chooser (preview)
            </Button>
            <p className="text-xs text-muted-foreground">
              组件路径：<code className="text-xs bg-muted px-1.5 py-0.5 rounded">@/components/auth/GoogleAccountChooser</code>
            </p>
            <GoogleAccountChooser
              open={chooserOpen}
              onOpenChange={setChooserOpen}
              onFixedAccountSignedIn={() => setChooserOpen(false)}
              onUseAnotherAccount={() => setChooserOpen(false)}
              previewOnly
            />
          </CardContent>
        </Card>
      </SubSection>

      {/* Demo accounts (QA only) */}
      <SubSection
        title="Demo accounts (QA only)"
        description="预览不同用户首次登录后看到的空投弹窗状态。生产 Auth 弹窗已下线该入口，研发如需复用直接引用 DemoAccountsBlock。"
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Fixed identities</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Matched user (A) → 4 matched cards · Welcome gift user (B) → 1 welcome_gift card。
              通过 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">ensure-demo-user</code> edge function 幂等创建账户后登录。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-md">
              <DemoAccountsBlock />
            </div>
            <p className="text-xs text-muted-foreground">
              组件路径：<code className="text-xs bg-muted px-1.5 py-0.5 rounded">@/components/auth/DemoAccountsBlock</code>
            </p>
          </CardContent>
        </Card>
      </SubSection>
    </SectionWrapper>
  );
};
